// components/map/WayneForestPolygons.tsx

import React from 'react';
import { Polygon } from 'react-native-maps';
import { PolygonData } from '@/types';

type WayneForestPolygonsProps = {
  polygons: PolygonData[];
};

export const WayneForestPolygons: React.FC<WayneForestPolygonsProps> = ({ polygons }) => {
  return (
    <>
      {polygons.map((poly, index) => (
        <Polygon
          key={index}
          coordinates={poly.outer}
          holes={poly.holes}
          strokeColor="#2E7D32"
          fillColor="rgba(46, 125, 50, 0.2)"
          strokeWidth={2}
        />
      ))}
    </>
  );
};
