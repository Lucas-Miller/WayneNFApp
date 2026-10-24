// hooks/useLocationTracking.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Coordinate } from '@/lib/types';

/**
 * Browser geolocation. On desktops this is usually Wi-Fi/IP based, so expect
 * lower accuracy and no heading compared with the phone app.
 */
export const useLocationTracking = () => {
  const [myLocation, setMyLocation] = useState<Coordinate | null>(null);
  const [heading, setHeading] = useState(0);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  const applyPosition = useCallback(({ coords }: GeolocationPosition) => {
    const location = { latitude: coords.latitude, longitude: coords.longitude };
    setMyLocation(location);
    if (coords.heading !== null && !Number.isNaN(coords.heading)) {
      setHeading(coords.heading);
    }
    return location;
  }, []);

  /**
   * Get current location once; resolves null if denied or unavailable
   */
  const getCurrentLocation = useCallback(
    () =>
      new Promise<Coordinate | null>((resolve) => {
        if (!('geolocation' in navigator)) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(applyPosition(position)),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      }),
    [applyPosition]
  );

  const stopTracking = useCallback(() => {
    setTracking(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  /**
   * Start continuous tracking; onError fires if permission is denied
   */
  const startTracking = useCallback(
    (onLocationUpdate: (coords: Coordinate) => void, onError: () => void) => {
      if (!('geolocation' in navigator)) return onError();
      setTracking(true);
      watchId.current = navigator.geolocation.watchPosition(
        (position) => onLocationUpdate(applyPosition(position)),
        () => {
          stopTracking();
          onError();
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    },
    [applyPosition, stopTracking]
  );

  useEffect(() => stopTracking, [stopTracking]);

  return { myLocation, heading, tracking, getCurrentLocation, startTracking, stopTracking };
};
