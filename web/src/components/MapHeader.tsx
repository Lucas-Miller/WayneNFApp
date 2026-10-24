// components/MapHeader.tsx

import { Link } from '@tanstack/react-router';
import { CircleUserRound, Mountain } from 'lucide-react';

export function MapHeader() {
  return (
    <header className="map-header">
      <div className="pill brand">
        <Mountain size={22} />
        <span>Wayne NF</span>
      </div>
      <Link to="/account" className="pill icon-pill" aria-label="Account">
        <CircleUserRound size={28} />
      </Link>
    </header>
  );
}
