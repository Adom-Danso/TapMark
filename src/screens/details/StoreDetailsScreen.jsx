import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { AUTH_COLORS, AUTH_SPACING } from '../auth/authTheme';

const StoreDetailsScreen = ({ route }) => {
  const { title = 'Store Details', imageUri } = route.params || {};

  return (
    <View style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Store details screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
    padding: AUTH_SPACING.screenX,
    gap: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    backgroundColor: AUTH_COLORS.card,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AUTH_COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: AUTH_COLORS.muted,
  },
});

export default StoreDetailsScreen;
