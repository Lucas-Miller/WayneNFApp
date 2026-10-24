// components/RoutePreviewCard.tsx

import { Car, Navigation } from 'lucide-react';
import type { RouteInfo } from '@/lib/types';

type RoutePreviewCardProps = {
  routeInfo: RouteInfo;
  onNavigate: () => void;
  onCancel: () => void;
};

export function RoutePreviewCard({ routeInfo, onNavigate, onCancel }: RoutePreviewCardProps) {
  return (
    <div className="card route-card">
      <div className="route-header">
        <Car size={24} className="accent" />
        <div>
          <div className="route-title">Route to Camping Spot</div>
          <div className="muted">
            {routeInfo.etaMinutes} min • {routeInfo.distanceMiles} mi
          </div>
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={onNavigate}>
          <Navigation size={18} />
          Open in Google Maps
        </button>
      </div>
    </div>
  );
}
