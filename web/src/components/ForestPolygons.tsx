// components/ForestPolygons.tsx

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

type ForestPolygonsProps = {
  // One entry per feature: [outer ring, ...holes]
  polygons: google.maps.LatLngLiteral[][][];
};

export function ForestPolygons({ polygons }: ForestPolygonsProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const shapes = polygons.map(
      (paths) =>
        new google.maps.Polygon({
          map,
          paths,
          strokeColor: '#2E7D32',
          strokeWeight: 2,
          fillColor: '#2E7D32',
          fillOpacity: 0.2,
          // Let clicks fall through to the map so in/out checks work inside the forest
          clickable: false,
        })
    );

    return () => shapes.forEach((shape) => shape.setMap(null));
  }, [map, polygons]);

  return null;
}
