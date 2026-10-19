import type { LatLng, TrackPoint } from "./types";

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function shouldRecordPoint(
  last: TrackPoint | undefined,
  next: TrackPoint,
  minDistanceM = 18,
  maxIntervalMs = 12_000
): boolean {
  if (!last) return true;
  if (next.t - last.t >= maxIntervalMs) return true;
  return haversineMeters(last, next) >= minDistanceM;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function trackLengthMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

/** Auckland default centre for first paint before GPS resolves */
export const DEFAULT_CENTER: LatLng = { lat: -36.8485, lng: 174.7633 };
