import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../auth/authTheme';
import { useLocation } from '../../context/LocationContext';
import { LocationSchema } from '@/schemas/location';

const MAP_DELTA = {
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const MapPickerScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const { currentLocation, recentLocations, updateLocation, setCurrentLocation, getLocationName } = useLocation();

  const sheetTranslate = useRef(new Animated.Value(80)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const [selectedLocation, setSelectedLocation] = useState({
    ...currentLocation,
  });
  const [pinLocation, setPinLocation] = useState({
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
  });

  const mapRegion = useMemo(
    () => ({
      latitude: pinLocation.latitude,
      longitude: pinLocation.longitude,
      ...MAP_DELTA,
    }),
    [pinLocation]
  );

  useEffect(() => {
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
  }, [sheetOpacity, sheetTranslate]);

  const handleDragEnd = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPinLocation({ latitude, longitude });
    setCurrentLocation({
      id: 'custom-pin',
      name: getLocationName(latitude, longitude).then(name => name),
      latitude,
      longitude,
    })
  };

  const handleSelectRecent = (item: LocationSchema) => {
    setCurrentLocation(item);
    setPinLocation({ latitude: item.latitude, longitude: item.longitude });
  };

  const handleConfirm = () => {
    const locationToSave = {
      ...selectedLocation,
      id: selectedLocation.id || `loc-${Date.now()}`,
    };
    updateLocation(locationToSave);
    navigation.goBack();
  };

  const renderRecentItem = ({ item }: { item: LocationSchema }) => {
    const isActive =
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
          {/* <Text style={styles.recentCoords}>
            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
          </Text> */}
        </View>
        {isActive ? (
          <Ionicons name="checkmark-circle" size={20} color={AUTH_COLORS.primary} />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={mapRegion}
        region={mapRegion}
        provider={PROVIDER_DEFAULT}
      >
        <Marker
          coordinate={pinLocation}
          draggable
          onDragEnd={handleDragEnd}
          pinColor={AUTH_COLORS.primary}
        />
      </MapView>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={AUTH_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose location</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: sheetOpacity,
            transform: [{ translateY: sheetTranslate }],
          },
        ]}
      >
        <View style={styles.currentWrap}>
          <Text style={styles.currentLabel}>Current location</Text>
          <Text style={styles.currentName}>{currentLocation.name}</Text>
        </View>
        {/* <View style={styles.coordsCard}>
          <Text style={styles.coordsLabel}>Selected coordinates</Text>
          <Text style={styles.coordsValue}>
            {pinLocation.latitude.toFixed(5)} , {pinLocation.longitude.toFixed(5)}
          </Text>
        </View> */}
        <Text style={styles.sectionTitle}>Recent locations</Text>
        <FlatList
          data={recentLocations}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          style={styles.recentList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="navigate" size={18} color={AUTH_COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No recent locations</Text>
              <Text style={styles.emptySubtitle}>Drag the pin and confirm to save one here.</Text>
            </View>
          }
        />
        <TouchableOpacity activeOpacity={0.9} style={styles.confirmButton} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.confirmText}>Confirm location</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AUTH_COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: AUTH_SPACING.screenX,
    paddingTop: 12,
    paddingBottom: AUTH_SPACING.screenY,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 6,
  },
  currentWrap: {
    marginBottom: 12,
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
  coordsCard: {
    paddingHorizontal: AUTH_SPACING.block,
    paddingVertical: 12,
    borderRadius: AUTH_RADII.card,
    backgroundColor: AUTH_COLORS.background,
    marginBottom: 14,
  },
  coordsLabel: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  coordsValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: AUTH_COLORS.text,
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
  recentCoords: {
    marginTop: 2,
    fontSize: 12,
    color: AUTH_COLORS.muted,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.primary,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MapPickerScreen;
