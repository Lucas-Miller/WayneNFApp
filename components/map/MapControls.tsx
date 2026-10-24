// components/map/MapControls.tsx

import React, { useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MapType } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MapControlsProps = {
  mapType: MapType;
  tracking: boolean;
  onToggleMapType: () => void;
  onToggleTracking: () => void;
  onCenterLocation: () => void;
  onSearchPress: () => void;
  // Extra space to leave below the buttons, e.g. for a bottom card
  bottomOffset?: number;
};

export const MapControls: React.FC<MapControlsProps> = ({
  mapType,
  tracking,
  onToggleMapType,
  onToggleTracking,
  onCenterLocation,
  onSearchPress,
  bottomOffset = 0,
}) => {
  const fabScale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  const handleCenterLocation = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    onCenterLocation();
  };

  return (
    <View style={[styles.fabContainer, { bottom: 24 + insets.bottom + bottomOffset }]}>
      {/* Coordinate Search */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onSearchPress}
        activeOpacity={0.8}
      >
        <MaterialIcons name="search" size={24} color="#2E7D32" />
      </TouchableOpacity>

      {/* Map Type Toggle */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onToggleMapType}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={mapType === 'standard' ? 'satellite' : 'map'}
          size={24}
          color="#2E7D32"
        />
      </TouchableOpacity>

      {/* Tracking Toggle */}
      <TouchableOpacity
        style={[styles.fab, tracking && styles.fabActive]}
        onPress={onToggleTracking}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={tracking ? 'gps-fixed' : 'gps-not-fixed'}
          size={24}
          color={tracking ? '#fff' : '#2E7D32'}
        />
      </TouchableOpacity>

      {/* Center on Location */}
      <Animated.View style={{ transform: [{ scale: fabScale }] }}>
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={handleCenterLocation}
          activeOpacity={0.8}
        >
          <MaterialIcons name="my-location" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    gap: 12,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabPrimary: {
    backgroundColor: '#2E7D32',
  },
  fabActive: {
    backgroundColor: '#1976D2',
  },
});
