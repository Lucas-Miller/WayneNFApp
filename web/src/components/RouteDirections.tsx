// components/RouteDirections.tsx

import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';
import type { Coordinate, RouteInfo } from '@/lib/types';

type RouteDirectionsProps = {
  origin: Coordinate;
  destination: Coordinate;
  onReady: (info: RouteInfo) => void;
  onError: () => void;
};

const METERS_PER_MILE = 1609.344;

export function RouteDirections({ origin, destination, onReady, onError }: RouteDirectionsProps) {
  const map = useMap();
  const routes = useMapsLibrary('routes');

  // Keep the latest callbacks without re-requesting directions when they change
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };

  const { latitude: oLat, longitude: oLng } = origin;
  const { latitude: dLat, longitude: dLng } = destination;

  useEffect(() => {
    if (!map || !routes) return;

    let cancelled = false;
    const renderer = new routes.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#1976D2', strokeWeight: 4 },
    });

    new routes.DirectionsService()
      .route({
        origin: { lat: oLat, lng: oLng },
        destination: { lat: dLat, lng: dLng },
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((result) => {
        if (cancelled) return;
        renderer.setDirections(result);
        const legs = result.routes[0]?.legs ?? [];
        const seconds = legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0);
        const meters = legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
        callbacks.current.onReady({
          etaMinutes: Math.round(seconds / 60),
          distanceMiles: Number((meters / METERS_PER_MILE).toFixed(1)),
        });
      })
      .catch(() => {
        if (!cancelled) callbacks.current.onError();
      });

    return () => {
      cancelled = true;
      renderer.setMap(null);
    };
  }, [map, routes, oLat, oLng, dLat, dLng]);

  return null;
}
