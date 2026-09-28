import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_COLORS, AUTH_RADII, AUTH_SPACING } from '../screens/auth/authTheme';

type CarouselEmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  variant?: 'empty' | 'error';
  actionLabel?: string;
  onRetry?: () => void;
  height?: number;
};

const CarouselEmptyState = ({
  icon = 'sparkles-outline',
  title,
  subtitle,
  variant = 'empty',
  actionLabel = 'Try again',
  onRetry,
  height = 180,
}: CarouselEmptyStateProps) => {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
      float.stopAnimation();
    };
  }, [float]);

  const floatTranslateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const floatScale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const resolvedIcon = variant === 'error' ? 'alert-circle-outline' : icon;

  return (
    <View style={[styles.container, { minHeight: height }]}>
      <View style={styles.artWrap}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        <Animated.View
          style={[
            styles.iconWrap,
            { transform: [{ translateY: floatTranslateY }, { scale: floatScale }] },
          ]}
        >
          <Ionicons name={resolvedIcon} size={26} color={AUTH_COLORS.primary} />
        </Animated.View>
        <View style={styles.dotOne} />
        <View style={styles.dotTwo} />
        <View style={styles.dotThree} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {variant === 'error' && onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8} style={styles.retryButton}>
          <Text style={styles.retryText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 4,
    gap: 6,
  },
  artWrap: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  glowOne: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(128, 24, 24, 0.08)',
  },
  glowTwo: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(128, 24, 24, 0.06)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCECEF',
  },
  dotOne: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F8B77C',
  },
  dotTwo: {
    position: 'absolute',
    bottom: 18,
    left: 14,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#E4A5A5',
  },
  dotThree: {
    position: 'absolute',
    bottom: 14,
    right: 18,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F5D36D',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AUTH_COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: AUTH_COLORS.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: AUTH_RADII.pill,
    backgroundColor: AUTH_COLORS.primary,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CarouselEmptyState;
