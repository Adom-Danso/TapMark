import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_SPACING } from '../screens/auth/authTheme';
import SearchBar from './SearchBar';

const HomeHeader = ({
  locationLabel = 'Delivering to',
  location = 'Nii Okaiman West',
  greeting = 'What are you craving today?',
  onSearchPress,
}) => {
  const insets = useSafeAreaInsets();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          paddingTop: insets.top + AUTH_SPACING.screenY,
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      <View style={styles.headerHalo} />
      <View style={styles.locationRow}>
        <View style={styles.locationIconWrap}>
          <Ionicons name="location-outline" size={18} color={AUTH_COLORS.primary} />
        </View>
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationLabel}>{locationLabel}</Text>
          <Text style={styles.locationText}>{location}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.locationAction}>
          <Ionicons name="chevron-down" size={18} color={AUTH_COLORS.muted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.greeting}>{greeting}</Text>
      <SearchBar
        placeholder="Food, restaurants, stores..."
        onPress={onSearchPress}
        style={styles.searchSpacing}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 18,
  },
  headerHalo: {
    position: 'absolute',
    left: -AUTH_SPACING.screenX,
    right: -AUTH_SPACING.screenX,
    top: 0,
    height: 140,
    backgroundColor: AUTH_COLORS.primarySoft,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    opacity: 0.35,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: AUTH_COLORS.muted,
    letterSpacing: 0.3,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
  locationAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    lineHeight: 28,
  },
  searchSpacing: {
    marginTop: 16,
  },
});

export default HomeHeader;
