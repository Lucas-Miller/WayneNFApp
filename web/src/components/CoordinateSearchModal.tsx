// components/CoordinateSearchModal.tsx

import { Search } from 'lucide-react';
import { useState } from 'react';
import { Modal } from './Modal';

type CoordinateSearchModalProps = {
  open: boolean;
  onSearch: (latitude: number, longitude: number) => void;
  onCancel: () => void;
};

export function CoordinateSearchModal({ open, onSearch, onCancel }: CoordinateSearchModalProps) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const close = () => {
    setLat('');
    setLng('');
    onCancel();
  };

  // Accept "39.4, -82.3" pasted into either field
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const parts = e.clipboardData.getData('text').split(/[,\s]+/).filter(Boolean);
    if (parts.length === 2 && parts.every((p) => !isNaN(parseFloat(p)))) {
      e.preventDefault();
      setLat(parts[0]);
      setLng(parts[1]);
    }
  };

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const valid = Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180;

  return (
    <Modal
      open={open}
      title="Search by Coordinates"
      subtitle="Enter latitude and longitude, or paste both into either field"
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSearch(latNum, lngNum);
          setLat('');
          setLng('');
        }}
      >
        <div className="coord-row">
          <label>
            <span className="label">Latitude</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="39.4"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              onPaste={handlePaste}
              autoFocus
            />
          </label>
          <label>
            <span className="label">Longitude</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="-82.3"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              onPaste={handlePaste}
            />
          </label>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!valid}>
            <Search size={18} />
            Search
          </button>
        </div>
      </form>
    </Modal>
  );
}
