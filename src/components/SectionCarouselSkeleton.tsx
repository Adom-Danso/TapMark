import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../screens/auth/authTheme';

interface SectionCarouselSkeletonProps {
  itemCount?: number;
  itemWidth?: number;
  itemHeight?: number;
  itemSeparatorWidth?: number;
  contentPaddingRight?: number;
}

const SectionCarouselSkeleton = ({
  itemCount = 2,
  itemWidth = 160,
  itemHeight = 210,
  itemSeparatorWidth = 14,
  contentPaddingRight = AUTH_SPACING.screenX,
}: SectionCarouselSkeletonProps) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [shimmerAnim]);

  const skeletonOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeletonCard,
            {
              width: itemWidth,
              height: itemHeight,
              marginRight: index < itemCount - 1 ? itemSeparatorWidth : contentPaddingRight,
              opacity: skeletonOpacity,
            },
          ]}
        >
          {/* Image placeholder */}
          <View style={styles.imagePlaceholder} />
          {/* Title placeholder */}
          <View style={[styles.textPlaceholder, styles.textPlaceholderLarge]} />
          {/* Meta placeholder */}
          <View style={[styles.textPlaceholder, styles.textPlaceholderSmall]} />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 2,
  },
  skeletonCard: {
    backgroundColor: AUTH_COLORS.card,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: AUTH_COLORS.muted,
    borderRadius: 8,
    opacity: 0.3,
  },
  textPlaceholder: {
    backgroundColor: AUTH_COLORS.muted,
    borderRadius: 4,
    opacity: 0.3,
  },
  textPlaceholderLarge: {
    height: 12,
    marginBottom: 4,
  },
  textPlaceholderSmall: {
    height: 8,
  },
});

export default SectionCarouselSkeleton;
