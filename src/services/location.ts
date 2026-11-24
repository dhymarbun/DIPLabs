import { collection, onSnapshot } from 'firebase/firestore';
import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';
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

export function requestLocation(): Promise<GeoCoordinates> {
  if (Platform.OS === 'web') {
    const geolocation = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geolocation) return Promise.reject(new Error('location-unavailable'));
    return new Promise((resolve, reject) => geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(new Error(error.code === 1 ? 'permission-denied' : 'location-unavailable')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    ));
  }
  return ExpoLocation.requestForegroundPermissionsAsync().then(async ({ status }) => {
    if (status !== ExpoLocation.PermissionStatus.GRANTED) throw new Error('permission-denied');
    const enabled = await ExpoLocation.hasServicesEnabledAsync();
    if (!enabled) throw new Error('location-disabled');
    const position = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  });
}

export function watchDeviceLocation(
  onLocation: (location: GeoCoordinates) => void,
  onError?: (error: LocationPermissionStatus) => void,
): () => void {
  if (Platform.OS === 'web') {
    const geolocation = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geolocation) { onError?.('unavailable'); return () => undefined; }
    const watchId = geolocation.watchPosition(
      (position) => onLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => onError?.(error.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => geolocation.clearWatch(watchId);
  }
  let cancelled = false;
  let subscription: ExpoLocation.LocationSubscription | undefined;
  void (async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== ExpoLocation.PermissionStatus.GRANTED) return onError?.('denied');
      if (!(await ExpoLocation.hasServicesEnabledAsync())) return onError?.('unavailable');
      subscription = await ExpoLocation.watchPositionAsync(
        { accuracy: ExpoLocation.Accuracy.High, distanceInterval: 5 },
        (position) => {
          if (!cancelled) onLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
      );
    } catch {
      if (!cancelled) onError?.('unavailable');
    }
  })();
  return () => { cancelled = true; subscription?.remove(); };
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
    const code = error instanceof Error ? error.message : 'location-unavailable';
    const reason = code === 'permission-denied' ? 'permission-denied' : code === 'location-disabled' ? 'location-disabled' : 'location-unavailable';
    return { ok: false, reason, message: reason === 'permission-denied' ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk presensi.' : reason === 'location-disabled' ? 'Layanan lokasi perangkat sedang mati.' : 'Lokasi perangkat belum tersedia.' };
  }
}
