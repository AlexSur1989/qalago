import type { GeoPoint } from './nearby-geo';

export type BrowserGeoResult =
  | { status: 'unsupported' }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'ready'; position: GeoPoint };

const GEO_TIMEOUT_MS = 12_000;

/**
 * One-shot passive geolocation (no repeated prompts).
 * Requires secure context in production; localhost is allowed for local QA.
 */
export function readBrowserGeolocationOnce(): Promise<BrowserGeoResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve({ status: 'unsupported' });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          status: 'ready',
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ status: 'denied' });
          return;
        }
        resolve({ status: 'error' });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: GEO_TIMEOUT_MS,
      },
    );
  });
}
