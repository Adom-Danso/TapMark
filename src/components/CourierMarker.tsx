import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAP_COLORS } from '../theme/mapStyle';

type CourierMarkerProps = {
  /** Diameter of the badge in px. */
  size?: number;
  /** Ionicons glyph rendered inside the badge. */
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Circular courier badge used as a custom map marker: a white ring around a
 * brand-filled disc with a white glyph. Rendered as a `<Marker>` child rather
 * than a default pin so it matches the app's brand language.
 */
const CourierMarker = ({ size = 40, icon = 'bicycle' }: CourierMarkerProps) => {
  const innerSize = size - 8;

  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.inner,
          { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
        ]}
      >
        <Ionicons name={icon} size={Math.round(size * 0.5)} color="#FFFFFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    backgroundColor: MAP_COLORS.markerRing,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MAP_COLORS.markerEdge,
    shadowColor: MAP_COLORS.markerFill,
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  inner: {
    backgroundColor: MAP_COLORS.markerFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CourierMarker;
