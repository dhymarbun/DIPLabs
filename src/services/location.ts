import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { Laboratory, GeoCoordinates, LocationCheckResult, LocationPermissionStatus } from '../types/location';

type GeolocationPosition = { coords: { latitude: number; longitude: number } };
type GeolocationError = { code: number };

export function calculateDistanceMeters(a: GeoCoordinates, b: GeoCoordinates): number {
  const radius = 6371000;
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getGeolocation(): Geolocation | undefined {
  return typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
}

export function requestLocation(): Promise<GeoCoordinates> {
  const geolocation = getGeolocation();
  if (!geolocation) return Promise.reject(new Error('location-unavailable'));
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position: GeolocationPosition) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error: GeolocationError) => reject(new Error(error.code === 1 ? 'permission-denied' : 'location-unavailable')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  });
}

export function watchDeviceLocation(
  onLocation: (location: GeoCoordinates) => void,
  onError?: (error: LocationPermissionStatus) => void,
): () => void {
  const geolocation = getGeolocation();
  if (!geolocation) {
    onError?.('unavailable');
    return () => undefined;
  }
  const watchId = geolocation.watchPosition(
    (position: GeolocationPosition) => onLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
    (error: GeolocationError) => onError?.(error.code === 1 ? 'denied' : 'unavailable'),
    { enableHighAccuracy: true, maximumAge: 5000 },
  );
  return () => geolocation.clearWatch(watchId);
}

export function subscribeLaboratories(
  onChange: (laboratories: Laboratory[]) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!isFirebaseConfigured) {
    onChange([]);
    return () => undefined;
  }
  return onSnapshot(collection(db, 'laboratories'), (snapshot) => {
    onChange(snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        name: String(data.name ?? ''),
        room: String(data.room ?? ''),
        description: data.description ? String(data.description) : undefined,
        latitude: Number(data.latitude ?? 0),
        longitude: Number(data.longitude ?? 0),
        radiusMeters: Number(data.radiusMeters ?? 0),
        updatedAt: String(data.updatedAt ?? ''),
      };
    }));
  }, onError);
}

export async function validateLocation(laboratory: Laboratory | undefined): Promise<LocationCheckResult> {
  if (!laboratory || laboratory.radiusMeters <= 0) {
    return { ok: false, reason: 'lab-location-not-configured', message: 'Lokasi laboratorium belum dikonfigurasi.' };
  }
  try {
    const userCoords = await requestLocation();
    const distanceMeters = calculateDistanceMeters(userCoords, laboratory);
    if (distanceMeters > laboratory.radiusMeters) {
      return { ok: false, reason: 'out-of-radius', distanceMeters, radiusMeters: laboratory.radiusMeters, message: `Anda berada ${Math.round(distanceMeters)} m dari laboratorium (radius ${laboratory.radiusMeters} m).` };
    }
    return { ok: true, userCoords, distanceMeters, radiusMeters: laboratory.radiusMeters };
  } catch (error) {
    const reason = error instanceof Error && error.message === 'permission-denied' ? 'permission-denied' : 'location-unavailable';
    return { ok: false, reason, message: reason === 'permission-denied' ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk presensi.' : 'Lokasi perangkat belum tersedia.' };
  }
}
