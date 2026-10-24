// hooks/map/useWayneForestData.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import { boundaryStore } from '@/services/offline';
import { findFeatureAt, ForestBoundary, toParcelPolygons } from '@/shared/forestBoundary';
import { ForestArea, forestAreaFromAttributes } from '@/shared/pointInfo';
import { PolygonData } from '@/types';

const toCoordinates = (ring: number[][]) =>
  ring.map(([longitude, latitude]) => ({ latitude, longitude }));

/**
 * Hook to manage Wayne National Forest boundary data. Shows the on-device copy
 * immediately, then quietly checks for a newer one.
 */
export const useWayneForestData = () => {
  const [boundary, setBoundary] = useState<ForestBoundary | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const local = await boundaryStore.loadLocal();
        if (!cancelled) setBoundary(local);
      } catch (error) {
        console.error('Could not load on-device boundary:', error);
      }

      try {
        const fresh = await boundaryStore.refresh();
        if (fresh && !cancelled) setBoundary(fresh);
      } catch {
        // Offline or every source down: the local copy is fine
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const polygons = useMemo<PolygonData[]>(
    () =>
      boundary
        ? toParcelPolygons(boundary).map((parcel) => ({
            outer: toCoordinates(parcel.outer),
            holes: parcel.holes.length ? parcel.holes.map(toCoordinates) : undefined,
          }))
        : [],
    [boundary]
  );

  /**
   * Find the forest area (county piece) containing a point, or null if outside
   */
  const getForestAreaAt = useCallback(
    (latitude: number, longitude: number): ForestArea | null => {
      const feature = boundary && findFeatureAt(boundary, latitude, longitude);
      return feature ? forestAreaFromAttributes(feature.attributes) : null;
    },
    [boundary]
  );

  /**
   * Check if a point is within Wayne National Forest boundaries
   */
  const isPointInForest = useCallback(
    (latitude: number, longitude: number): boolean => getForestAreaAt(latitude, longitude) !== null,
    [getForestAreaAt]
  );

  return {
    polygons,
    loading: !boundary,
    // When the boundary data was downloaded from ODNR (undefined for very old caches)
    dataDate: boundary?.fetched_at,
    getForestAreaAt,
    isPointInForest,
  };
};
