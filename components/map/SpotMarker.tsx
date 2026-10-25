// components/map/SpotMarker.tsx

import React, { useEffect, useState } from 'react';
import { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

// Same orange as the web app's saved-spot pins
export const SAVED_SPOT_COLOR = '#F57C00';
// Saved on this device, waiting to upload
export const PENDING_SPOT_COLOR = '#757575';

type SpotMarkerProps = {
  coordinate: { latitude: number; longitude: number };
  title: string;
  color: string;
};

/**
 * Map pin for one of the user's spots. An icon instead of Google's default pin,
 * since Android can only tint those by hue (no exact colors, no gray).
 */
export const SpotMarker: React.FC<SpotMarkerProps> = ({ coordinate, title, color }) => {
  // Android draws custom marker views once as an image. Keep redrawing briefly so
  // the icon is captured after it renders (and again if the color changes), then
  // stop, since redrawing every pin constantly is slow.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [color]);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      // The pin's tip, not its center, sits on the coordinate
      anchor={{ x: 0.5, y: 0.9 }}
      zIndex={0}
      tracksViewChanges={tracksViewChanges}
    >
      <MaterialIcons name="place" size={36} color={color} />
    </Marker>
  );
};
