import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AUTH_COLORS } from '../screens/auth/authTheme';

type LocationSkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

const LocationSkeleton = ({ width = 140, height = 16, radius = 8, style }: LocationSkeletonProps) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 1, 0.45],
  });

  return (
    <Animated.View
      accessibilityLabel="Loading location"
      style={[styles.bar, { width, height, borderRadius: radius, opacity }, style]}
    />
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: AUTH_COLORS.line,
  },
});

export default LocationSkeleton;
