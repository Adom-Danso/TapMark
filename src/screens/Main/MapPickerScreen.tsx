import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { useLocation } from '../../context/LocationContext';
import { LocationSchema } from '@/schemas/location';
import { baseMapProps } from '@/theme/mapStyle';
import LocationSkeleton from '../../components/LocationSkeleton';
import { showToast } from '@/utils/notifications';
import FlagMarker, { FLAG_MARKER_ANCHOR } from '@/components/FlagMarker';
import { getGpsDistanceInMeters } from '@/utils/shared';

type MapPickerOrigin = 'home' | 'cart';

type MapPickerRouteParams = {
  origin?: MapPickerOrigin;
};

type Coords = {
  latitude: number;
  longitude: number;
};

const MAP_DELTA = {
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const RESOLVE_DEBOUNCE_MS = 400;
const PROGRAMMATIC_MOVE_WINDOW_MS = 1200;
/** Within this many metres of the device GPS we consider the pin "where you are". */
const GPS_MATCH_TOLERANCE_M = 100;

/** Bad coordinates crash Android's map natively — only ever seed the pin from valid values. */
const toValidCoords = ({ latitude, longitude }: Coords): Coords | null =>
  Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;

const MapPickerScreen = ({ navigation, route }: { navigation: any; route: { params?: MapPickerRouteParams } }) => {
  const insets = useSafeAreaInsets();
  const { currentLocation, recentLocations, updateLocation, requestLocation, getLocationName, getDeviceLocation } = useLocation();
  const origin = route?.params?.origin ?? 'home';
  const isExitingRef = useRef(false);
  const mapRef = useRef<MapView | null>(null);
  const mountedRef = useRef(true);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveTokenRef = useRef(0);
  const programmaticMoveRef = useRef<(Coords & { at: number }) | null>(null);
  /** Device GPS captured on mount — the "where you actually are" baseline. */
  const gpsRef = useRef<Coords | null>(null);
  /** True while the "different from your location" prompt is on screen (blocks back). */
  const isConfirmingRef = useRef(false);
  /** Last panned location we already prompted/acted on, so we don't nag on re-render. */
  const handledCoordsRef = useRef<string | null>(null);
  /** Last location the user confirmed/started from — what Cancel reverts to. */
  const lastConfirmedRef = useRef<LocationSchema | null>(currentLocation);
  /** Only prompt once the user has genuinely dragged the map (not on mount settles). */
  const userPannedRef = useRef(false);

  const sheetTranslate = useRef(new Animated.Value(80)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const [selectedLocation, setSelectedLocation] = useState<LocationSchema | null>(currentLocation);
  const [pinLocation, setPinLocation] = useState<Coords | null>(
    currentLocation ? toValidCoords(currentLocation) : null,
  );
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [isRecentering, setIsRecentering] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    Animated.parallel([
      Animated.timing(sheetTranslate, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      mountedRef.current = false;
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
      }
      resolveTokenRef.current += 1;
    };
  }, [sheetOpacity, sheetTranslate]);

  // The location may arrive after the screen mounts (cold start from the Cart tab).
  useEffect(() => {
    const coords = currentLocation ? toValidCoords(currentLocation) : null;
    if (!selectedLocation && currentLocation && coords) {
      setSelectedLocation(currentLocation);
      setPinLocation(coords);
    }
  }, [currentLocation, selectedLocation]);

  // Capture the device's live GPS once, so we can warn when the pin is dragged
  // away from where the user actually is. Read-only: never touches currentLocation.
  useEffect(() => {
    let active = true;
    getDeviceLocation()
      .then((coords) => {
        if (active && coords) {
          gpsRef.current = coords;
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [getDeviceLocation]);

  // Keep the "revert" target in step with the last confirmed location.
  useEffect(() => {
    if (currentLocation) {
      lastConfirmedRef.current = currentLocation;
    }
  }, [currentLocation]);

  const applyLocation = useCallback(
    (location: LocationSchema) => {
      const next = { ...location, id: `loc-${Date.now()}` };
      updateLocation(next);
      lastConfirmedRef.current = next;
    },
    [updateLocation],
  );

  const revertToPrevious = useCallback(() => {
    const previous = lastConfirmedRef.current;
    const coords = previous ? toValidCoords(previous) : null;
    if (!previous || !coords) {
      return;
    }
    programmaticMoveRef.current = { ...coords, at: Date.now() };
    setSelectedLocation(previous);
    setPinLocation(coords);
    mapRef.current?.animateToRegion({ ...coords, ...MAP_DELTA }, 350);
  }, []);

  const promptIfNeedsConfirmation = useCallback(
    (location: LocationSchema) => {
      // Ignore the map's initial/incidental settles — only warn after a real drag.
      if (!userPannedRef.current || isConfirmingRef.current) {
        return;
      }

      const gps = gpsRef.current;
      if (!gps) {
        return;
      }

      const distance = getGpsDistanceInMeters(
        { lat: gps.latitude, lng: gps.longitude },
        { lat: location.latitude, lng: location.longitude },
      );
      if (distance <= GPS_MATCH_TOLERANCE_M) {
        return;
      }

      const key = `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
      if (handledCoordsRef.current === key) {
        return;
      }

      isConfirmingRef.current = true;
      Alert.alert(
        'Different from your location',
        'This pin is not where you are right now. Confirm this is where you want your order delivered.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              isConfirmingRef.current = false;
              handledCoordsRef.current = key;
              revertToPrevious();
            },
          },
          {
            text: 'Use this location',
            onPress: () => {
              isConfirmingRef.current = false;
              handledCoordsRef.current = key;
              applyLocation(location);
            },
          },
        ],
        { cancelable: false },
      );
    },
    [applyLocation, revertToPrevious],
  );

  const handleExit = useCallback(async () => {
    if (isExitingRef.current) {
      return;
    }

    // Back is disabled while the "different from your location" prompt is up.
    if (isConfirmingRef.current) {
      return;
    }

    isExitingRef.current = true;

    // Whatever the sheet is showing is what the user chose — persist it before
    // leaving. If a lookup is still in flight, resolve it first so we never save
    // the previous address.
    let location = selectedLocation;
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
      if (pinLocation) {
        const name = await getLocationName(pinLocation.latitude, pinLocation.longitude, false);
        location = {
          id: `loc-${pinLocation.latitude.toFixed(4)}-${pinLocation.longitude.toFixed(4)}`,
          name,
          latitude: pinLocation.latitude,
          longitude: pinLocation.longitude,
        };
      }
    }

    const previous = lastConfirmedRef.current;
    const changed =
      !!location &&
      (!previous ||
        Math.abs(previous.latitude - location.latitude) > 1e-5 ||
        Math.abs(previous.longitude - location.longitude) > 1e-5);
    if (changed) {
      applyLocation(location);
    }

    if (origin === 'cart') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeIndex' }],
      });
      navigation.getParent()?.navigate('Cart', { screen: 'CartIndex' });
      return;
    }

    navigation.goBack();
  }, [applyLocation, getLocationName, navigation, origin, pinLocation, selectedLocation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (isExitingRef.current) {
        return;
      }

      event.preventDefault();
      handleExit();
    });

    return unsubscribe;
  }, [handleExit, navigation]);

  const resolveAddress = async (coords: Coords) => {
    const token = resolveTokenRef.current + 1;
    resolveTokenRef.current = token;
    setIsResolvingName(true);

    const name = await getLocationName(coords.latitude, coords.longitude, false);

    if (!mountedRef.current || resolveTokenRef.current !== token) {
      // A newer move superseded this lookup.
      return;
    }

    const location: LocationSchema = {
      id: `loc-${coords.latitude.toFixed(4)}-${coords.longitude.toFixed(4)}`,
      name,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    setSelectedLocation(location);
    setIsResolvingName(false);
    promptIfNeedsConfirmation(location);
  };

  const scheduleResolve = (coords: Coords) => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
    }

    resolveTimerRef.current = setTimeout(() => {
      resolveTimerRef.current = null;
      resolveAddress(coords);
    }, RESOLVE_DEBOUNCE_MS);
  };

  const isProgrammaticMove = (coords: Coords) => {
    const target = programmaticMoveRef.current;
    if (!target) {
      return false;
    }

    const withinWindow = Date.now() - target.at < PROGRAMMATIC_MOVE_WINDOW_MS;
    const matches =
      Math.abs(target.latitude - coords.latitude) < 1e-5 && Math.abs(target.longitude - coords.longitude) < 1e-5;

    if (!withinWindow || !matches) {
      return false;
    }

    programmaticMoveRef.current = null;
    return true;
  };

  const moveTo = (coords: Coords) => {
    programmaticMoveRef.current = { ...coords, at: Date.now() };
    setPinLocation(coords);
    mapRef.current?.animateToRegion({ ...coords, ...MAP_DELTA }, 350);
  };

  // Keep the pin locked to the visual centre of the map while it is being dragged.
  const handleRegionChange = (region: Region) => {
    setPinLocation({ latitude: region.latitude, longitude: region.longitude });
  };

  const handleRegionChangeComplete = (region: Region) => {
    const coords = { latitude: region.latitude, longitude: region.longitude };
    setPinLocation(coords);

    // Centring on a saved address or the GPS fix must not overwrite its name.
    if (isProgrammaticMove(coords)) {
      return;
    }

    scheduleResolve(coords);
  };

  const handleSelectRecent = (item: LocationSchema) => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    resolveTokenRef.current += 1;
    setIsResolvingName(false);
    setSelectedLocation(item);
    moveTo({ latitude: item.latitude, longitude: item.longitude });
  };

  const handleLocateMe = async () => {
    if (isRecentering) {
      return;
    }

    setIsRecentering(true);
    try {
      const resolved = await requestLocation();

      if (!resolved) {
        showToast('error', "Couldn't get your location");
        return;
      }

      const coords = { latitude: resolved.latitude, longitude: resolved.longitude };
      setSelectedLocation(resolved);
      moveTo(coords);
    } finally {
      setIsRecentering(false);
    }
  };

  const renderRecentItem = ({ item }: { item: LocationSchema }) => {
    const isActive =
      !!selectedLocation &&
      Math.abs(item.latitude - selectedLocation.latitude) < 0.0001 &&
      Math.abs(item.longitude - selectedLocation.longitude) < 0.0001;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.recentItem, isActive ? styles.recentItemActive : null]}
        onPress={() => handleSelectRecent(item)}
      >
        <View style={styles.recentIcon}>
          <Ionicons name="location" size={16} color={AUTH_COLORS.primary} />
        </View>
        <View style={styles.recentTextWrap}>
          <Text style={styles.recentName}>{item.name}</Text>
        </View>
        {isActive ? <Ionicons name="checkmark-circle" size={20} color={AUTH_COLORS.primary} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {pinLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ ...pinLocation, ...MAP_DELTA }}
          provider={PROVIDER_DEFAULT}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPanDrag={() => {
            userPannedRef.current = true;
          }}
          {...baseMapProps}
        >
          <Marker
            coordinate={pinLocation}
            anchor={FLAG_MARKER_ANCHOR}
            zIndex={2}
          >
            <FlagMarker size={40} />
          </Marker>
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color={AUTH_COLORS.primary} />
          <Text style={styles.mapPlaceholderText}>Getting your map ready…</Text>
        </View>
      )}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleExit}>
          <Ionicons name="chevron-back" size={22} color={AUTH_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose location</Text>
        <View style={styles.headerSpacer} />
      </View>

      {sheetHeight > 0 ? (
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.recenterButton, { bottom: sheetHeight + 16 }]}
          onPress={handleLocateMe}
          disabled={isRecentering}
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
        >
          {isRecentering ? (
            <ActivityIndicator size="small" color={AUTH_COLORS.primary} />
          ) : (
            <Ionicons name="navigate" size={20} color={AUTH_COLORS.primary} />
          )}
        </TouchableOpacity>
      ) : null}

      <Animated.View
        onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          {
            opacity: sheetOpacity,
            transform: [{ translateY: sheetTranslate }],
            paddingBottom: AUTH_SPACING.screenY + insets.bottom,
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.currentWrap}>
          <Text style={styles.currentLabel}>Delivering to</Text>
          {isResolvingName ? (
            <View style={styles.resolvingWrap}>
              <LocationSkeleton width={190} height={16} radius={8} />
              <Text style={styles.currentHint}>Finding address…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.currentName} numberOfLines={1}>
                {selectedLocation?.name || 'Drop a pin to set your address'}
              </Text>
              <Text style={styles.currentHint}>Pan the map to move the pin</Text>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recent locations</Text>
        <FlatList
          data={recentLocations}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          style={styles.recentList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="navigate" size={18} color={AUTH_COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No recent locations</Text>
              <Text style={styles.emptySubtitle}>Locations you pick will show up here.</Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: AUTH_COLORS.muted,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.card,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  recenterButton: {
    position: 'absolute',
    right: AUTH_SPACING.screenX,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.card,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AUTH_COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 10,
    paddingBottom: AUTH_SPACING.screenY,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 6,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AUTH_COLORS.line,
    marginBottom: 14,
  },
  currentWrap: {
    marginBottom: 14,
  },
  currentLabel: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  currentName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  resolvingWrap: {
    marginTop: 6,
    gap: 8,
  },
  currentHint: {
    marginTop: 6,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    marginBottom: 12,
  },
  recentList: {
    maxHeight: 170,
  },
  emptyState: {
    borderRadius: AUTH_RADII.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    backgroundColor: AUTH_COLORS.background,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 8,
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
  },
  recentItemActive: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: '#FFF1F1',
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentTextWrap: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
});

export default MapPickerScreen;
