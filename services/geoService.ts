/**
 * Geo Service — address geocoding and distance calculation.
 * Uses mock coordinates when real ones are unavailable.
 * Replace geocodeAddress with a real provider (e.g. Google Maps API) in production.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Deterministic mock geocoder.
 * Produces stable coordinates based on address string hash,
 * centred on the São Paulo metro region.
 */
export function geocodeAddressMock(address: string): GeoPoint {
  // Simple djb2-style hash
  let h = 5381;
  for (let i = 0; i < address.length; i++) {
    h = ((h << 5) + h) ^ address.charCodeAt(i);
    h = h >>> 0; // keep as unsigned 32-bit
  }
  // Scatter within a ~3° × 3° box centred on -23.55, -46.63 (São Paulo)
  const lat = -23.55 + ((h & 0xfff) / 0xfff) * 3 - 1.5;
  const lng = -46.63 + (((h >> 12) & 0xfff) / 0xfff) * 3 - 1.5;
  return { lat, lng };
}

/**
 * Haversine distance in kilometres between two geo points.
 */
export function calculateDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const aVal =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

/**
 * Estimate ETA in minutes given distance and average speed (km/h).
 */
export function estimateETA(distanceKm: number, speedKmh = 60): number {
  return Math.round((distanceKm / speedKmh) * 60);
}
