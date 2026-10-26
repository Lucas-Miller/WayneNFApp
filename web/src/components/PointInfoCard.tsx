// components/PointInfoCard.tsx - details for a tapped/searched point, with copy and save

import type { Coordinate } from '@/lib/types';
import { Spot } from '@/lib/types';
import {
  distanceMiles,
  type ForestArea,
  formatCoordinates,
  formatDistance,
  formatDMS,
} from '@shared/pointInfo';
import { Check, Copy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type PointInfoCardProps = {
  point: Coordinate;
  forestArea: ForestArea | null;
  myLocation: Coordinate | null;
  onClose: () => void;
  spot?: Spot | null;
  children?: React.ReactNode;
};

export function PointInfoCard({
  point,
  forestArea,
  myLocation,
  onClose,
  spot,
  children,
}: PointInfoCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Leave Escape to an open dialog (e.g. coordinate search) first
      if (e.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = setTimeout(() => setCopyState('idle'), 1800);
    return () => clearTimeout(timer);
  }, [copyState]);

  const coordinates = formatCoordinates(point);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const details = [
    forestArea?.county && `${forestArea.county} County`,
    forestArea?.huntingStatus && `Hunting ${forestArea.huntingStatus.toLowerCase()}`,
    myLocation && formatDistance(distanceMiles(myLocation, point)),
  ].filter(Boolean);

  return (
    <section className="card point-card" aria-label={spot ? `Saved spot: ${spot.name}` : 'Selected location'}>
      <div className="point-card-header">
        {/* Saved spots get their name as a title, with the status chip underneath */}
        <div className="point-card-title">
          {spot && <h2 className="spot-name">{spot.name}</h2>}
          <span className={`status-chip ${forestArea ? 'inside' : 'outside'}`}>
            {forestArea ? '✓ Inside Wayne NF' : '✗ Outside Wayne NF'}
          </span>
        </div>
        <button className="icon-btn" onClick={onClose} title="Close (Esc)" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {details.length > 0 && <div className="muted point-details">{details.join(' · ')}</div>}

      <div className="coord-box">
        <div className="coord-text">
          <div className="coord-decimal">{coordinates}</div>
          <div className="muted coord-dms">{formatDMS(point)}</div>
        </div>
        <button className="btn btn-secondary copy-btn" onClick={handleCopy}>
          {copyState === 'copied' ? <Check size={18} /> : <Copy size={18} />}
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy'}
        </button>
      </div>

      {children}

    </section>
  );
}
