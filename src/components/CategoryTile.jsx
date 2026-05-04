import React, { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH_COLORS } from '../screens/auth/authTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CategoryTile = ({ label, imageUri, imageSize = 64, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const haloSize = imageSize + 16;
  const tileWidth = Math.max(86, imageSize + 22);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tile, { width: tileWidth, transform: [{ scale }] }, style]}
    >
      <View style={styles.imageStack}>
        <View
          style={[
            styles.halo,
            { width: haloSize, height: haloSize, borderRadius: haloSize / 2 },
          ]}
        />
        <View
          style={[
            styles.imageWrap,
            { width: imageSize, height: imageSize, borderRadius: imageSize / 2 },
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imageFallback} />
          )}
        </View>
      </View>
      <Text numberOfLines={2} style={styles.label}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    gap: 8,
  },
  imageStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: AUTH_COLORS.primarySoft,
    opacity: 0.45,
  },
  imageWrap: {
    overflow: 'hidden',
    backgroundColor: AUTH_COLORS.card,
    borderWidth: 1,
    borderColor: AUTH_COLORS.line,
    shadowColor: AUTH_COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
  },
  label: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
});

export default CategoryTile;
