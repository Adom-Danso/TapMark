import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MAP_COLORS } from '../theme/mapStyle';

type DestinationMarkerProps = {
  /** Height of the pin glyph in px. */
  size?: number;
};

/**
 * Code-built destination pin (no image asset required).
 *
 * A white `map-marker` glyph sits behind a brand-red one to produce an outlined
 * teardrop pin. The marker is anchored at its tip via `DESTINATION_MARKER_ANCHOR`
 * so the point lands exactly on the delivery coordinate.
 */
export const DESTINATION_MARKER_ANCHOR = { x: 0.5, y: 1 };

const DestinationMarker = ({ size = 40 }: DestinationMarkerProps) => {
  const box = size + 6;

  return (
    <View
      style={[styles.container, { width: box, height: box }]}
      pointerEvents="none"
    >
      <MaterialCommunityIcons name="map-marker" size={box} color={MAP_COLORS.markerRing} />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <MaterialCommunityIcons
          name="map-marker"
          size={size}
          color={MAP_COLORS.markerFill}
          style={styles.pin}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    textShadowColor: 'rgba(128, 24, 24, 0.28)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 2 },
  },
});

export default DestinationMarker;
