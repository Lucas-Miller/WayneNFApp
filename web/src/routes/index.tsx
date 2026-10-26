// routes/index.tsx - main map screen

import { CoordinateSearchModal } from '@/components/CoordinateSearchModal';
import { ForestPolygons } from '@/components/ForestPolygons';
import { MapControls, type MapType } from '@/components/MapControls';
import { MapHeader } from '@/components/MapHeader';
import { MessageBanner } from '@/components/MessageBanner';
import { PointInfoCard } from '@/components/PointInfoCard';
import { RouteDirections } from '@/components/RouteDirections';
import { RoutePreviewCard } from '@/components/RoutePreviewCard';
import { SaveSpotForm } from '@/components/SaveSpotForm';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useCreateSpot, useSpots } from '@/hooks/useSpots';
import { useWayneForestData } from '@/hooks/useWayneForestData';
import { useAuth } from '@/lib/auth';
import { CONFIG, DEFAULT_CENTER } from '@/lib/config';
import type { Coordinate, RouteInfo } from '@/lib/types';
import { Spot } from '@/lib/types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AdvancedMarker, Map, type MapMouseEvent, Pin, useMap } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useState } from 'react';

import { SpotActions } from '@/components/SpotActions';

type MapSearch = {
  destLat?: number;
  destLng?: number;
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) ? n : undefined;
};

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): MapSearch => ({
    destLat: toNumber(search.destLat),
    destLng: toNumber(search.destLng),
  }),
  component: MapScreen,
});

const MAP_ID = 'main';
const toLatLng = ({ latitude, longitude }: Coordinate) => ({ lat: latitude, lng: longitude });

function MapScreen() {
  const navigate = useNavigate({ from: '/' });
  const { destLat, destLng } = Route.useSearch();
  const destination =
    destLat !== undefined && destLng !== undefined ? { latitude: destLat, longitude: destLng } : null;

  const map = useMap(MAP_ID);
  const { token, sessionExpired } = useAuth();

  const [mapType, setMapType] = useState<MapType>('satellite');
  const [selectedPoint, setSelectedPoint] = useState<Coordinate | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const { polygons, error: forestError, getForestAreaAt, isPointInForest } = useWayneForestData();
  const { myLocation, tracking, getCurrentLocation, startTracking, stopTracking } = useLocationTracking();
  const createSpot = useCreateSpot();

  const { data: savedSpots = []} = useSpots();

  const selectedSpot = savedSpots.find((s) => s.id === selectedSpotId) ?? null;

  const dismissMessage = useCallback(() => setMessage(''), []);

  useEffect(() => {
    if (forestError) setMessage('Could not load forest boundaries');
  }, [forestError]);

  useEffect(() => {
    if (sessionExpired) setMessage('Session expired — sign in again to save spots');
  }, [sessionExpired]);

  /**
   * Select a point: drop a pin and show its info card
   */
  const selectPoint = useCallback(
    (latitude: number, longitude: number, recenter: boolean) => {
      setSelectedSpotId(null);
      setSelectedPoint({ latitude, longitude });
      if (recenter && map) {
        map.panTo({ lat: latitude, lng: longitude });
        map.setZoom(16);
      }
    },
    [map]
  );

  const closePointInfo = useCallback(() => {
    setSelectedSpotId(null);
    setSelectedPoint(null);
  }, []);

  const selectSpot = (spot: Spot) => {
    setSelectedPoint(spot);
    setSelectedSpotId(spot.id);
  };

  /**
   * While tracking: follow the user and report whether they're inside the forest
   */
  const followLocation = useCallback(
    ({ latitude, longitude }: Coordinate) => {
      setMessage(
        isPointInForest(latitude, longitude)
          ? '✓ Within Wayne National Forest'
          : '✗ Outside Wayne National Forest'
      );
      map?.panTo({ lat: latitude, lng: longitude });
    },
    [isPointInForest, map]
  );

  const handleMapClick = (e: MapMouseEvent) => {
    const latLng = e.detail.latLng;
    if (latLng) selectPoint(latLng.lat, latLng.lng, false);
  };

  const handleSaveSpot = (name: string) => {
    if (!selectedPoint) return;
    createSpot.mutate(
      { name, ...selectedPoint },
      {
        onSuccess: () => {
          closePointInfo();
          setMessage('✓ Spot saved successfully!');
        },
        onError: () => setMessage('✗ Failed to save spot'),
      }
    );
  };

  const handleCenterLocation = async () => {
    const location = myLocation ?? (await getCurrentLocation());
    if (!location) {
      setMessage('Location permission denied');
      return;
    }
    map?.panTo(toLatLng(location));
    map?.setZoom(17);
  };

  const handleToggleTracking = () => {
    if (tracking) {
      stopTracking();
    } else {
      startTracking(
        followLocation,
        () => setMessage('Location permission denied')
      );
    }
  };

  // Arriving from a saved spot: show it, and fetch our location so we can route there
  useEffect(() => {
    if (destLat === undefined || destLng === undefined || !map) return;
    map.panTo({ lat: destLat, lng: destLng });
    map.setZoom(14);
    getCurrentLocation().then((location) => {
      if (!location) setMessage('Allow location access to get directions');
    });
  }, [destLat, destLng, map, getCurrentLocation]);

  const handleCancelRoute = () => {
    setRouteInfo(null);
    navigate({ search: {} });
  };

  const handleNavigate = () => {
    if (!destination) return;
    const { latitude, longitude } = destination;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
      '_blank',
      'noopener'
    );
  };

  const handleDirections = (spot: Spot) => {
    navigate({ search: { destLat: spot.latitude, destLng: spot.longitude } });
    closePointInfo();
  };

  const handleRouteError = useCallback(() => {
    setMessage('Could not load directions');
    setRouteInfo(null);
  }, []);

  if (!CONFIG.GOOGLE_MAPS_API_KEY) {
    return (
      <div className="page">
        <div className="card page-card">
          <h2>Missing Google Maps key</h2>
          <p className="muted">
            Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>web/.env.local</code> and restart the dev
            server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-screen">
      <MapHeader />

      <Map
        id={MAP_ID}
        mapId={CONFIG.GOOGLE_MAP_ID}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={10}
        mapTypeId={mapType}
        disableDefaultUI
        zoomControl
        scaleControl
        gestureHandling="greedy"
        clickableIcons={false}
        onClick={handleMapClick}
        className="map"
      >
        <ForestPolygons polygons={polygons} />

        {myLocation && (
          <AdvancedMarker position={toLatLng(myLocation)} title="Your location" zIndex={2}>
            <div className="my-location-dot" />
          </AdvancedMarker>
        )}

        {savedSpots.map((spot) => 
          (
            <AdvancedMarker position={toLatLng(spot)} title={spot.name} zIndex={0} key={spot.id} onClick={() => selectSpot(spot)}>
              <Pin background="#F57C00" borderColor="#E65100" glyphColor="#fff" />
            </AdvancedMarker>
         )
        )}

        {selectedPoint && (
          <AdvancedMarker position={toLatLng(selectedPoint)} title="Selected location" zIndex={1}>
            <Pin background="#1976D2" borderColor="#0D47A1" glyphColor="#fff" />
          </AdvancedMarker>
        )}

        {destination && (
          <AdvancedMarker position={toLatLng(destination)} title="Saved spot" zIndex={3}>
            <Pin background="#2E7D32" borderColor="#1B5E20" glyphColor="#fff" />
          </AdvancedMarker>
        )}

        {destination && myLocation && (
          <RouteDirections
            origin={myLocation}
            destination={destination}
            onReady={setRouteInfo}
            onError={handleRouteError}
          />
        )}
      </Map>

      <MessageBanner message={message} onDismiss={dismissMessage} />

      <MapControls
        mapType={mapType}
        tracking={tracking}
        onToggleMapType={() => setMapType((prev) => (prev === 'roadmap' ? 'satellite' : 'roadmap'))}
        onToggleTracking={handleToggleTracking}
        onCenterLocation={handleCenterLocation}
        onSearchPress={() => setSearchOpen(true)}
      />

      {selectedPoint ? (
        <PointInfoCard
          key={selectedSpot ? `spot-${selectedSpot.id}` : selectedPoint.latitude + ', ' + selectedPoint.longitude}
          point={selectedPoint}
          forestArea={getForestAreaAt(selectedPoint.latitude, selectedPoint.longitude)}
          myLocation={myLocation}
          onClose={closePointInfo}
          spot={selectedSpot}
        >
          {selectedSpot ? (<SpotActions spot={selectedSpot} onNavigate={() => handleDirections(selectedSpot)} onClose={closePointInfo} />) : (<SaveSpotForm signedIn={!!token} saving={createSpot.isPending} onSave={handleSaveSpot}/>)}
          
          
        </PointInfoCard>
      ) : (
        destination &&
        routeInfo && (
          <RoutePreviewCard routeInfo={routeInfo} onNavigate={handleNavigate} onCancel={handleCancelRoute} />
        )
      )}

      <CoordinateSearchModal
        open={searchOpen}
        onSearch={(lat, lng) => {
          selectPoint(lat, lng, true);
          setSearchOpen(false);
        }}
        onCancel={() => setSearchOpen(false)}
      />
    </div>
  );
}
