import { Laboratory as SharedLaboratory } from './notification';

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export type Laboratory = SharedLaboratory;

export type LocationCheckResult =
  | { ok: true; userCoords: GeoCoordinates; distanceMeters: number; radiusMeters: number }
  | {
      ok: false;
      reason:
        | 'permission-denied'
        | 'location-disabled'
        | 'location-unavailable'
        | 'lab-location-not-configured'
        | 'out-of-radius';
      distanceMeters?: number;
      radiusMeters?: number;
      message: string;
    };
