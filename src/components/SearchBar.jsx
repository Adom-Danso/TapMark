import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII } from '../screens/auth/authTheme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SearchBar = ({ placeholder, onPress, style, showFilter = true }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  };

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.searchBar, { transform: [{ scale }] }, style]}
    >
      <Ionicons name="search-outline" size={20} color={AUTH_COLORS.muted} />
      <Text style={styles.searchPlaceholder}>{placeholder}</Text>
      {showFilter ? <View style={styles.searchDivider} /> : null}
      {showFilter ? (
        <View style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color={AUTH_COLORS.primary} />
        </View>
      ) : null}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: AUTH_RADII.pill,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: AUTH_COLORS.muted,
  },
  searchDivider: {
    width: 1,
    height: 22,
    backgroundColor: AUTH_COLORS.line,
  },
  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.primarySoft,
  },
});

export default SearchBar;
