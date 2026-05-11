import { LocationSchema } from '@/schemas/location';
import React, { createContext, useContext, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { showToast } from '@/utils/notifications';
import { getLocations, saveLocations } from '@/utils/locations';

type LocationContextType = {
  currentLocation: LocationSchema | null;
  isLoading: boolean;
  recentLocations: LocationSchema[];
  updateLocation: (location: LocationSchema) => void;
  setCurrentLocation: (location: LocationSchema) => void;
  addLocation: (location: LocationSchema) => void;
  getLocationName: (latitude: number, longitude: number) => Promise<string>;
}
const LocationContext = createContext<LocationContextType | null>(null);

const normalizeKey = (location: LocationSchema) => `${location.name}-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationSchema | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentLocations, setRecentLocations] = useState<LocationSchema[]>([]);

  const updateLocation = (location: LocationSchema) => {
    setCurrentLocation(location);
    setRecentLocations((prev) => {
      const next = [location, ...prev.filter((item) => normalizeKey(item) !== normalizeKey(location))];
      return next.slice(0, 6);
    });
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      return place.city || place.street || place.name || "Unknown Location";
    } catch (error) {
      showToast("error", "Failed to get location name");
      return "Unknown Location";
    }
  };

  const addLocation = (location: LocationSchema) => {
    const newRecentLocations = [location, ...recentLocations.filter((item) => normalizeKey(item) !== normalizeKey(location))].slice(0, 6);
    setRecentLocations(newRecentLocations);
    saveLocations(newRecentLocations);
  };

  React.useEffect(() => {
    async function getCurrentLocation() {
      setIsLoading(true);
      // load recent location from storage.
      const recentLocs = await getLocations();
      if (recentLocs.length > 0) {
        setRecentLocations(recentLocs);
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast("error", "Permission to access location was denied");
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const currentLoc: LocationSchema = {
        id: `loc-${Date.now()}`,
        name: 'Current Location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(currentLoc);

      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        console.log("📍 Place from Expo:", place);

        if (place) {
          currentLoc.name = place.city || place.street || place.name || "Current Location";
        }
      } catch (error) {
        setIsLoading(false);
        showToast("error", "Failed to get location name");
        return
      }

      currentLoc.id = normalizeKey(currentLoc);
      setCurrentLocation(currentLoc);
      setIsLoading(false);
    }

    getCurrentLocation();
  }, []);

  React.useEffect(() => {
    if (currentLocation) {
      setIsLoading(false);
    }
  }, [currentLocation]);

  const value = useMemo(
    () => ({
      currentLocation,
      isLoading,
      recentLocations,
      updateLocation,
      setCurrentLocation,
      addLocation,
      getLocationName,
    }),
    [currentLocation, isLoading, recentLocations]
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
