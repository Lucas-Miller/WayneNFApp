// components/MapScreen.tsx - Refactored version

import { API_CONFIG } from '@/config/api.config';
import { useAuth } from '@/context/AuthContext';
import { useLocationTracking, useRouteNavigation, useSpotManagement, useWayneForestData } from '@/hooks/map';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSpots } from '@/hooks/useSpots';
import { distanceMiles } from '@/shared/pointInfo';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, StatusBar, StyleSheet, View } from 'react-native';
import MapView, { MapPressEvent, MapType, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CoordinateSearchModal,
  MapControls,
  MapHeader,
  MessageBanner,
  PointInfoCard,
  RoutePreviewCard,
  SpotMarker,
  SAVED_SPOT_COLOR,
  PENDING_SPOT_COLOR,
  WayneForestPolygons,
} from './map';

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const { token } = useAuth();
  // Space taken by the system navigation bar (app draws edge to edge on Android)
  const insets = useSafeAreaInsets();

  // Route params for navigation destination
  const { destLat, destLng } = useLocalSearchParams<{ destLat?: string; destLng?: string }>();
  const destination = destLat && destLng
    ? { latitude: Number(destLat), longitude: Number(destLng) }
    : null;

  // Map state
  const [region, setRegion] = useState({
    latitude: 39.4,
    longitude: -82.3,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [mapType, setMapType] = useState<MapType>('satellite');
  // Tracking arrow (follows the device while tracking)
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  // Point the user tapped or searched; shows the info card
  const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bottomCardHeight, setBottomCardHeight] = useState(0);
  const [message, setMessage] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // Custom hooks
  const { polygons, getForestAreaAt, isPointInForest } = useWayneForestData();
  const { myLocation, heading, tracking, getCurrentLocation, startTracking, stopTracking } = useLocationTracking();
  const { showPreview, routeInfo, updateRouteInfo, clearRoute, openExternalDirections } = useRouteNavigation();
  const { saving, saveSpot } = useSpotManagement();
  const { isOffline } = useNetworkStatus();
  const { spots, pending } = useSpots();

  /**
   * Check if a point is within Wayne National Forest and show message
   */
  const checkPoint = (latitude: number, longitude: number) => {
    const inside = isPointInForest(latitude, longitude);
    setMessage(
      inside
        ? '✓ Within Wayne National Forest'
        : '✗ Outside Wayne National Forest'
    );
    setMarker({ latitude, longitude });
    setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  };

  /**
   * Handle map press - select the point and show its info card
   */
  const handleMapPress = (e: MapPressEvent) => {
    setSelectedPoint(e.nativeEvent.coordinate);
  };

  const closePointInfo = useCallback(() => {
    setSelectedPoint(null);
    setBottomCardHeight(0);
  }, []);

  /**
   * Handle spot save with success/error messaging
   */
  const handleSaveSpot = async (name: string) => {
    if (!selectedPoint) return;
    const result = await saveSpot(selectedPoint, name);
    setMessage(
      {
        saved: '✓ Spot saved successfully!',
        queued: "✓ Saved on this device — it'll sync when you're back online",
        failed: '✗ Failed to save spot',
      }[result]
    );
    if (result !== 'failed') closePointInfo();
  };

  // Directions need a connection; offline, give the straight-line distance instead
  const destinationKey = destination ? `${destination.latitude},${destination.longitude}` : null;
  const hasLocation = !!myLocation;
  useEffect(() => {
    if (!destinationKey || !isOffline || !destination) return;
    setMessage(
      myLocation
        ? `Offline: no directions. Spot is ${distanceMiles(myLocation, destination).toFixed(1)} mi away in a straight line`
        : 'Offline: directions unavailable'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per destination/connection/location-fix change
  }, [destinationKey, isOffline, hasLocation]);

  /**
   * Center map on user's current location
   */
  const handleCenterLocation = async () => {
    let location = myLocation;

    if (!location) {
      location = await getCurrentLocation();
      if (!location) {
        setMessage('Location permission denied');
        return;
      }
    }

    setRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    mapRef.current?.animateCamera({ center: location, zoom: 17 }, { duration: 400 });
  };

  /**
   * Handle tracking toggle
   */
  const handleToggleTracking = () => {
    if (tracking) {
      stopTracking();
    } else {
      startTracking((coords) => {
        checkPoint(coords.latitude, coords.longitude);
      });
    }
  };

  /**
   * Handle coordinate search
   */
  const handleCoordinateSearch = (latitude: number, longitude: number) => {
    setSelectedPoint({ latitude, longitude });
    setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    setSearchModalVisible(false);
  };

  /**
   * Handle route cancellation
   */
  const handleCancelRoute = () => {
    clearRoute();
    router.replace('/');
  };

  /**
   * Handle external navigation
   */
  const handleNavigate = () => {
    if (destination) {
      openExternalDirections(destination);
    }
  };

  // Determine origin for directions
  const origin = myLocation ?? (marker || { latitude: region.latitude, longitude: region.longitude });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <MapHeader offline={isOffline} onAccountPress={() => router.push('/account')} />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        mapType={mapType}
        provider="google"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handleMapPress}
        mapPadding={{ top: 0, right: 0, bottom: insets.bottom, left: 0 }}
      >
        {/* Wayne National Forest Polygons */}
        <WayneForestPolygons polygons={polygons} />

        {/* User-placed marker */}
        {marker && (
          <Marker coordinate={marker} anchor={{ x: 0.5, y: 0.5 }} flat rotation={heading}>
            <MaterialIcons name="navigation" size={32} color="#1976D2" />
          </Marker>
        )}

        {/* User's Saved Location markers */}
        {spots.map((spot) => (
          <SpotMarker key={spot.id} coordinate={spot} title={spot.name} color={SAVED_SPOT_COLOR} />
        ))}

        {/* User's Pending Saved Location markers */}
        {pending.map((spot) => (
          <SpotMarker
            key={spot.localId}
            coordinate={spot}
            title={`${spot.name} (waiting to sync)`}
            color={PENDING_SPOT_COLOR}
          />
        ))}

        {/* Selected point (drawn above saved spots) */}
        {selectedPoint && <Marker coordinate={selectedPoint} pinColor="#1976D2" zIndex={1} />}

        {/* Destination marker */}
        {destination && <Marker coordinate={destination} pinColor="#2E7D32" />}

        {/* Route directions */}
        {destination && myLocation && !isOffline && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={API_CONFIG.GOOGLE_MAPS_API_KEY}
            mode="DRIVING"
            strokeWidth={4}
            strokeColor="#1976D2"
            onReady={(result) => {
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 150, right: 60, bottom: 300, left: 60 },
                animated: true,
              });
              updateRouteInfo(Math.round(result.duration), Number(result.distance.toFixed(1)));
            }}
            onError={() => {
              setMessage('Could not load directions');
              clearRoute();
            }}
          />
        )}
      </MapView>

      {/* Message Banner */}
      <MessageBanner message={message} onDismiss={() => setMessage('')} />

      {/* Map Controls */}
      <MapControls
        mapType={mapType}
        tracking={tracking}
        onToggleMapType={() => setMapType((prev) => (prev === 'standard' ? 'satellite' : 'standard'))}
        onToggleTracking={handleToggleTracking}
        onCenterLocation={handleCenterLocation}
        onSearchPress={() => setSearchModalVisible(true)}
        bottomOffset={bottomCardHeight ? bottomCardHeight + 12 : 0}
      />

      {/* Point Info Card (takes the place of the route card while open) */}
      {selectedPoint ? (
        <KeyboardAvoidingView behavior="padding" style={[styles.bottomSheet, { bottom: 24 + insets.bottom }]} pointerEvents="box-none">
          <PointInfoCard
            point={selectedPoint}
            forestArea={getForestAreaAt(selectedPoint.latitude, selectedPoint.longitude)}
            myLocation={myLocation}
            signedIn={!!token}
            saving={saving}
            onSave={handleSaveSpot}
            onClose={closePointInfo}
            onSignIn={() => router.push('/account')}
            onLayout={(e) => setBottomCardHeight(e.nativeEvent.layout.height)}
          />
        </KeyboardAvoidingView>
      ) : (
        destination &&
        showPreview && (
          <RoutePreviewCard
            routeInfo={routeInfo}
            onNavigate={handleNavigate}
            onCancel={handleCancelRoute}
          />
        )
      )}

      {/* Coordinate Search Modal */}
      <CoordinateSearchModal
        visible={searchModalVisible}
        onSearch={handleCoordinateSearch}
        onCancel={() => setSearchModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
});