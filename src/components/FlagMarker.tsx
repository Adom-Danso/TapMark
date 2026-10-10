import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MAP_COLORS } from '../theme/mapStyle';

type FlagMarkerProps = {
  /** Height of the flag glyph in px. */
  size?: number;
};

/**
 * Point of the flag marker that lands on the chosen coordinate.
 *
 * `flag-variant` draws its pole on the left of the glyph, so — unlike the
 * teardrop `DestinationMarker` (bottom-centre) — the reference point is the
 * base of the pole, roughly a quarter in from the left. Tune here if the flag
 * sits slightly off the map centre on device.
 */
export const FLAG_MARKER_ANCHOR = { x: 0.28, y: 0.9 };

/**
 * Code-built "drop location" flag pin (no image asset required).
 *
 * A white `flag-variant` glyph sits behind a brand-red one to produce an
 * outlined flag, matching `DestinationMarker`/`CourierMarker`.
 */
const FlagMarker = ({ size = 40 }: FlagMarkerProps) => {
  const box = size + 6;

  return (
    <View
      style={[styles.container, { width: box, height: box }]}
      pointerEvents="none"
    >
      <MaterialCommunityIcons name="flag-variant" size={box} color={MAP_COLORS.markerRing} />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <MaterialCommunityIcons
          name="flag-variant"
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

export default FlagMarker;
