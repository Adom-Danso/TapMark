import { LocationSchema } from '@/schemas/location';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { showToast } from '@/utils/notifications';
import { getLocations, saveLocations } from '@/utils/locations';

export type LocationStatus =
  | 'idle'
  | 'requestingPermission'
  | 'locating'
  | 'resolvingName'
  | 'ready'
  | 'denied'
  | 'error';

type LocationContextType = {
  currentLocation: LocationSchema | null;
  status: LocationStatus;
  isLoading: boolean;
  isLocating: boolean;
  isResolvingName: boolean;
  recentLocations: LocationSchema[];
  requestLocation: () => Promise<LocationSchema | null>;
  updateLocation: (location: LocationSchema) => void;
  setCurrentLocation: (location: LocationSchema) => void;
  addLocation: (location: LocationSchema) => void;
  getLocationName: (latitude: number, longitude: number, notify?: boolean) => Promise<string>;
};

const LocationContext = createContext<LocationContextType | null>(null);

/** How long we wait for a GPS lock before surfacing a retryable error. */
const LOCATE_TIMEOUT_MS = 15000;

const normalizeKey = (location: LocationSchema) => `${location.name}-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;

const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

/**
 * Maps feeds these straight into LatLngBounds/CameraUpdateFactory, where a NaN
 * or out-of-range value crashes natively — so never let one reach the context.
 */
const isValidCoords = (latitude?: unknown, longitude?: unknown): boolean =>
  typeof latitude === 'number' &&
  typeof longitude === 'number' &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180;

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentLocation, setCurrentLocationState] = useState<LocationSchema | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [recentLocations, setRecentLocations] = useState<LocationSchema[]>([]);
  const requestRef = useRef(0);
  const currentLocationRef = useRef<LocationSchema | null>(null);

  const setCurrentLocation = useCallback((location: LocationSchema) => {
    if (!isValidCoords(location.latitude, location.longitude)) {
      return;
    }

    currentLocationRef.current = location;
    setCurrentLocationState(location);
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number, notify = false): Promise<string | null> => {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (!place) {
        return null;
      }
      return place.city || place.street || place.name || 'Current Location';
    } catch (error) {
      if (notify) {
        showToast('error', 'Failed to get location name');
      }
      return null;
    }
  };

  const getLocationName = async (latitude: number, longitude: number, notify = true) => {
    const name = await reverseGeocode(latitude, longitude, notify);
    return name || 'Unknown Location';
  };

  const updateLocation = (location: LocationSchema) => {
    if (!isValidCoords(location.latitude, location.longitude)) {
      return;
    }

    setCurrentLocation(location);
    const next = [location, ...recentLocations.filter((item) => normalizeKey(item) !== normalizeKey(location))].slice(0, 6);
    setRecentLocations(next);
    saveLocations(next);
  };

  const addLocation = (location: LocationSchema) => {
    if (!isValidCoords(location.latitude, location.longitude)) {
      return;
    }

    const next = [location, ...recentLocations.filter((item) => normalizeKey(item) !== normalizeKey(location))].slice(0, 6);
    setRecentLocations(next);
    saveLocations(next);
  };

  const requestLocation = useCallback(async (): Promise<LocationSchema | null> => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const isStale = () => requestRef.current !== requestId;

    const settle = async (latitude: number, longitude: number): Promise<LocationSchema | null> => {
      if (isStale() || !isValidCoords(latitude, longitude)) {
        return null;
      }

      const resolved: LocationSchema = {
        id: `loc-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
        name: 'Current Location',
        latitude,
        longitude,
      };
      setCurrentLocation(resolved);
      setStatus('resolvingName');

      const name = await reverseGeocode(latitude, longitude, false);
      if (isStale()) {
        return null;
      }

      const finalLocation = name ? { ...resolved, name } : resolved;
      setCurrentLocation(finalLocation);
      setStatus('ready');
      return finalLocation;
    };

    try {
      const existingPermission = await Location.getForegroundPermissionsAsync();
      if (isStale()) {
        return null;
      }

      if (existingPermission.status !== 'granted') {
        setStatus('requestingPermission');
        const { status: grantedStatus } = await Location.requestForegroundPermissionsAsync();
        if (isStale()) {
          return null;
        }
        if (grantedStatus !== 'granted') {
          setStatus('denied');
          showToast('error', 'Permission to access location was denied');
          return null;
        }
      }

      setStatus('locating');

      // Surface an approximate position immediately so callers are never left
      // waiting on a cold GPS lock before they have coordinates to work with.
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (isStale()) {
          return null;
        }
        if (isValidCoords(lastKnown?.coords.latitude, lastKnown?.coords.longitude)) {
          setCurrentLocation({
            id: `loc-${lastKnown.coords.latitude.toFixed(4)}-${lastKnown.coords.longitude.toFixed(4)}`,
            name: 'Current Location',
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }
      } catch {
        // Last known position is best effort only.
      }

      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LOCATE_TIMEOUT_MS,
        'Location request timed out',
      );

      if (isStale()) {
        return null;
      }

      return await settle(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      if (isStale()) {
        return null;
      }

      // We already hold coordinates (last known position) — degrade gracefully
      // instead of blocking the whole app behind a retry screen.
      const fallback = currentLocationRef.current;
      if (fallback) {
        setStatus('ready');
        return fallback;
      }

      setStatus('error');
      return null;
    }
  }, [setCurrentLocation]);

  React.useEffect(() => {
    getLocations().then((recentLocs) => {
      if (recentLocs.length > 0) {
        setRecentLocations(recentLocs);
      }
    });
    requestLocation();
  }, [requestLocation]);

  const isLocating = status === 'idle' || status === 'requestingPermission' || status === 'locating';
  const isResolvingName = status === 'resolvingName';
  const isLoading = isLocating || isResolvingName;

  const value = useMemo(
    () => ({
      currentLocation,
      status,
      isLoading,
      isLocating,
      isResolvingName,
      recentLocations,
      requestLocation,
      updateLocation,
      setCurrentLocation,
      addLocation,
      getLocationName,
    }),
    [currentLocation, status, isLoading, isLocating, isResolvingName, recentLocations, requestLocation],
  );

  return React.createElement(LocationContext.Provider, { value: value as any }, children);
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
