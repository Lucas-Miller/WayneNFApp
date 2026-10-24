// components/PointInfoCard.tsx - details for a tapped/searched point, with copy and save

import { Link } from '@tanstack/react-router';
import { Check, Copy, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  distanceMiles,
  type ForestArea,
  formatCoordinates,
  formatDistance,
  formatDMS,
} from '@shared/pointInfo';
import type { Coordinate } from '@/lib/types';

type PointInfoCardProps = {
  point: Coordinate;
  forestArea: ForestArea | null;
  myLocation: Coordinate | null;
  signedIn: boolean;
  saving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
};

export function PointInfoCard({
  point,
  forestArea,
  myLocation,
  signedIn,
  saving,
  onSave,
  onClose,
}: PointInfoCardProps) {
  const [name, setName] = useState('');
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
    <section className="card point-card" aria-label="Selected location">
      <div className="point-card-header">
        <span className={`status-chip ${forestArea ? 'inside' : 'outside'}`}>
          {forestArea ? '✓ Inside Wayne NF' : '✗ Outside Wayne NF'}
        </span>
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

      {signedIn ? (
        <form
          className="save-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave(name.trim());
          }}
        >
          <input
            className="input"
            placeholder="Name this spot, e.g. Creek Overlook"
            aria-label="Spot name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || saving}>
            <MapPin size={18} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      ) : (
        <p className="muted sign-in-hint">
          <Link to="/account">Sign in</Link> to save this spot.
        </p>
      )}
    </section>
  );
}
