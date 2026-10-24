// hooks/map/useRouteNavigation.ts

import { useState, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import { Coordinate, RouteInfo } from '@/types';

/**
 * Hook to manage route navigation and directions
 */
export const useRouteNavigation = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  /**
   * Set route information (duration and distance)
   */
  const updateRouteInfo = useCallback((etaMinutes: number, distanceMiles: number) => {
    setRouteInfo({ etaMinutes, distanceMiles });
    setShowPreview(true);
  }, []);

  /**
   * Clear route preview
   */
  const clearRoute = useCallback(() => {
    setShowPreview(false);
    setRouteInfo(null);
  }, []);

  /**
   * Open external navigation app (Apple Maps or Google Maps)
   */
  const openExternalDirections = useCallback((destination: Coordinate) => {
    const { latitude, longitude } = destination;

    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
    });

    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error('Failed to open navigation app:', err)
      );
    }
  }, []);

  return {
    showPreview,
    routeInfo,
    updateRouteInfo,
    clearRoute,
    openExternalDirections,
  };
};
