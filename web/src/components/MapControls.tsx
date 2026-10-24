// components/MapControls.tsx

import { Crosshair, LocateFixed, LocateOff, Map as MapIcon, Satellite, Search } from 'lucide-react';

export type MapType = 'roadmap' | 'satellite';

type MapControlsProps = {
  mapType: MapType;
  tracking: boolean;
  onToggleMapType: () => void;
  onToggleTracking: () => void;
  onCenterLocation: () => void;
  onSearchPress: () => void;
};

export function MapControls({
  mapType,
  tracking,
  onToggleMapType,
  onToggleTracking,
  onCenterLocation,
  onSearchPress,
}: MapControlsProps) {
  return (
    <div className="fab-stack">
      <button className="fab" onClick={onSearchPress} title="Search by coordinates">
        <Search size={22} />
      </button>
      <button
        className="fab"
        onClick={onToggleMapType}
        title={mapType === 'roadmap' ? 'Satellite view' : 'Map view'}
      >
        {mapType === 'roadmap' ? <Satellite size={22} /> : <MapIcon size={22} />}
      </button>
      <button
        className={`fab ${tracking ? 'fab-active' : ''}`}
        onClick={onToggleTracking}
        title={tracking ? 'Stop tracking' : 'Track my location'}
        aria-pressed={tracking}
      >
        {tracking ? <LocateFixed size={22} /> : <LocateOff size={22} />}
      </button>
      <button className="fab fab-primary" onClick={onCenterLocation} title="Center on my location">
        <Crosshair size={22} />
      </button>
    </div>
  );
}
