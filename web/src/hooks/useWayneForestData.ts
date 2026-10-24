// hooks/useWayneForestData.ts

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  fetchLatestBoundary,
  findFeatureAt,
  type ForestBoundary,
  parseBoundary,
  toParcelPolygons,
} from '@shared/forestBoundary';
import { forestAreaFromAttributes } from '@shared/pointInfo';
import { CONFIG } from '@/lib/config';

/**
 * Our API mirror, then ODNR, then the snapshot bundled with the app (loaded only
 * when both are unreachable, since it's ~400 KB gzipped)
 */
async function loadBoundary(): Promise<ForestBoundary> {
  try {
    const result = await fetchLatestBoundary(CONFIG.API_BASE_URL);
    if (result.status === 'updated') return result.boundary;
  } catch (error) {
    console.warn('Live boundary unavailable, using bundled snapshot:', error);
  }
  const snapshot = await import('@shared/wayne-forest-boundary.esrijson?raw');
  return parseBoundary(JSON.parse(snapshot.default))!;
}

const toLatLng = (ring: number[][]) => ring.map(([lng, lat]) => ({ lat, lng }));

/**
 * Wayne National Forest boundary data
 */
export const useWayneForestData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['wayne-forest-boundary'],
    queryFn: loadBoundary,
    staleTime: Infinity,
  });

  // One entry per parcel: [outer ring, ...holes]
  const polygons = useMemo(
    () =>
      data
        ? toParcelPolygons(data).map((parcel) => [toLatLng(parcel.outer), ...parcel.holes.map(toLatLng)])
        : [],
    [data]
  );

  /**
   * Find the forest area (county piece) containing a point, or null if outside
   */
  const getForestAreaAt = useCallback(
    (latitude: number, longitude: number) => {
      const feature = data && findFeatureAt(data, latitude, longitude);
      return feature ? forestAreaFromAttributes(feature.attributes) : null;
    },
    [data]
  );

  const isPointInForest = useCallback(
    (latitude: number, longitude: number) => getForestAreaAt(latitude, longitude) !== null,
    [getForestAreaAt]
  );

  return { polygons, loading: isLoading, error, getForestAreaAt, isPointInForest };
};
