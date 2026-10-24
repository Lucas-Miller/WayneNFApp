// hooks/map/useLocationTracking.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordinate } from '@/types';

/**
 * Hook to manage device location tracking
 */
export const useLocationTracking = () => {
  const [myLocation, setMyLocation] = useState<Coordinate | null>(null);
  const [heading, setHeading] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  /**
   * Request location permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
    return status === 'granted';
  }, []);

  /**
   * Get current device location once
   */
  const getCurrentLocation = useCallback(async (): Promise<Coordinate | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const { coords } = await Location.getCurrentPositionAsync({});
      const location = { latitude: coords.latitude, longitude: coords.longitude };
      setMyLocation(location);
      if (coords.heading !== null) {
        setHeading(coords.heading);
      }
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }, [requestPermissions]);

  /**
   * Start continuous location tracking
   */
  const startTracking = useCallback(
    async (onLocationUpdate?: (coords: Coordinate, heading: number) => void) => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return false;

      setTracking(true);

      try {
        locationSub.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            distanceInterval: 1,
            timeInterval: 1000,
          },
          ({ coords }) => {
            const location = { latitude: coords.latitude, longitude: coords.longitude };
            const currentHeading = coords.heading ?? 0;

            setMyLocation(location);
            setHeading(currentHeading);

            if (onLocationUpdate) {
              onLocationUpdate(location, currentHeading);
            }
          }
        );
        return true;
      } catch (error) {
        console.error('Failed to start location tracking:', error);
        setTracking(false);
        return false;
      }
    },
    [requestPermissions]
  );

  /**
   * Stop continuous location tracking
   */
  const stopTracking = useCallback(() => {
    setTracking(false);
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (locationSub.current) {
        locationSub.current.remove();
      }
    };
  }, []);

  return {
    myLocation,
    heading,
    tracking,
    permissionStatus,
    getCurrentLocation,
    startTracking,
    stopTracking,
  };
};
