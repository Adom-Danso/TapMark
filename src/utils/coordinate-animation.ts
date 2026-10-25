export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceMeters = (from: LatLng, to: LatLng): number => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getPathDistanceMeters = (points: LatLng[]): number => {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceMeters(points[index - 1], points[index]);
  }
  return total;
};

/** Removes consecutive points that are effectively the same fix. */
const dedupe = (points: LatLng[]): LatLng[] => {
  const cleaned: LatLng[] = [];
  for (const point of points) {
    if (cleaned.length > 0 && distanceMeters(cleaned[cleaned.length - 1], point) <= 1) {
      continue;
    }
    cleaned.push(point);
  }
  return cleaned;
};

const interpolate = (
  points: LatLng[],
  segmentLengths: number[],
  totalLength: number,
  progress: number,
): LatLng => {
  if (points.length === 1 || totalLength <= 0) {
    return points[points.length - 1];
  }

  let remaining = totalLength * Math.max(0, Math.min(1, progress));

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    if (remaining <= segmentLength || index === segmentLengths.length - 1) {
      const ratio = segmentLength === 0 ? 0 : Math.min(1, remaining / segmentLength);
      const start = points[index];
      const end = points[index + 1];
      return {
        latitude: start.latitude + (end.latitude - start.latitude) * ratio,
        longitude: start.longitude + (end.longitude - start.longitude) * ratio,
      };
    }
    remaining -= segmentLength;
  }

  return points[points.length - 1];
};

type AnimateAlongCoordinatesOptions = {
  from: LatLng;
  through: LatLng[];
  durationMs: number;
  onFrame: (coordinate: LatLng) => void;
  onDone?: () => void;
};

/**
 * Animates a coordinate from ``from`` along ``through`` over ``durationMs``.
 * Returns a cancel function; callers must invoke it when the animation is
 * replaced or the screen unmounts.
 */
export const animateAlongCoordinates = ({
  from,
  through,
  durationMs,
  onFrame,
  onDone,
}: AnimateAlongCoordinatesOptions): (() => void) => {
  const points = dedupe([from, ...through]);

  if (points.length < 2) {
    onFrame(points[0] ?? from);
    onDone?.();
    return () => {};
  }

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    const length = distanceMeters(points[index - 1], points[index]);
    segmentLengths.push(length);
    totalLength += length;
  }

  if (totalLength <= 0) {
    onFrame(points[points.length - 1]);
    onDone?.();
    return () => {};
  }

  const startedAt = Date.now();
  const duration = Math.max(durationMs, 1);
  // The map redraws the route on every frame, so cap marker updates at ~20fps.
  const minFrameIntervalMs = 50;
  let lastFrameAt = 0;
  let frameId: number | null = null;
  let cancelled = false;

  const tick = () => {
    if (cancelled) {
      return;
    }

    const now = Date.now();
    const progress = Math.min(1, (now - startedAt) / duration);

    if (progress >= 1 || now - lastFrameAt >= minFrameIntervalMs) {
      lastFrameAt = now;
      onFrame(interpolate(points, segmentLengths, totalLength, progress));
    }

    if (progress < 1) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    onDone?.();
  };

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
  };
};
