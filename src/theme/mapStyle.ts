import { Platform } from 'react-native';
import type { MapStyleElement, MapType } from 'react-native-maps';

/**
 * Warm, brand-matched "flat & friendly" map palette.
 *
 * Colours are derived from the app tokens in `src/screens/auth/authTheme.js`
 * so the map sits comfortably inside the cream/red UI instead of clashing
 * with it. POIs, transit lines and building footprints are stripped so only
 * roads, water and a few muted labels remain.
 */
export const MAP_COLORS = {
  land: '#FFF7F3',
  manMade: '#F6EDE7',
  natural: '#F3EFE4',
  water: '#CDE4EE',
  park: '#DCEBCD',
  road: '#FFFFFF',
  roadCasing: '#EFE7E3',
  highway: '#FBE3CC',
  highwayCasing: '#F3D3B5',
  label: '#7B6F6F',
  labelHalo: '#FFF7F3',
  route: '#801818',
  routeCasing: '#FFFFFF',
  routeHalo: 'rgba(128, 24, 24, 0.12)',
  markerFill: '#801818',
  markerRing: '#FFFFFF',
  markerEdge: 'rgba(128, 24, 24, 0.12)',
};

/**
 * Google Maps JSON style. NOTE: Google-only. Passing this to a MapView that
 * is backed by Apple Maps is a no-op, which is why iOS uses `baseMapProps`
 * below to fall back to Apple's `mutedStandard` map type instead.
 */
export const CARTOON_MAP_STYLE: MapStyleElement[] = [
  // Base geometry + labels.
  { elementType: 'geometry', stylers: [{ color: MAP_COLORS.land }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: MAP_COLORS.label }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: MAP_COLORS.labelHalo }] },

  // Administrative boundaries and place names.
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: MAP_COLORS.roadCasing }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#6A5A56' }] },

  // Points of interest: hide everything, then bring parks back as soft green.
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: MAP_COLORS.park }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#7BA05B' }] },

  // Roads: white fill with a light casing so they read as drawn outline.
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: MAP_COLORS.road }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: MAP_COLORS.roadCasing }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9A8C87' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: MAP_COLORS.road }] },
  { featureType: 'road.local', elementType: 'geometry.fill', stylers: [{ color: MAP_COLORS.road }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: MAP_COLORS.highway }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: MAP_COLORS.highwayCasing }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#B08A66' }] },

  // Transit + man-made/natural landscape.
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: MAP_COLORS.manMade }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: MAP_COLORS.natural }] },

  // Water.
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: MAP_COLORS.water }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6FA9C4' }] },
];

export const IS_IOS = Platform.OS === 'ios';

/**
 * Platform-aware base map props.
 *
 * - Android: Google Maps is the only provider, so the pastel JSON style applies.
 * - iOS: uses Apple Maps (we intentionally stay on the native provider), which
 *   ignores `customMapStyle`; `mutedStandard` is Apple's calmer, low-POI map and
 *   is the closest native equivalent to the flat look.
 *
 * Spread onto a `<MapView {...baseMapProps} />`.
 */
export const baseMapProps: { customMapStyle?: MapStyleElement[]; mapType?: MapType } = IS_IOS
  ? { mapType: 'mutedStandard' }
  : { customMapStyle: CARTOON_MAP_STYLE };
