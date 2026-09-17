'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  latitude: number;
  longitude: number;
  hint: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
};

function CenterTracker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMove(center.lat, center.lng);
    },
  });
  return null;
}

export function LocationMapPicker({
  latitude,
  longitude,
  hint,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const [lat, setLat] = useState(latitude);
  const [lng, setLng] = useState(longitude);

  useEffect(() => {
    setLat(latitude);
    setLng(longitude);
  }, [latitude, longitude]);

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{hint}</p>
      <div style={{ position: 'relative', height: 220, marginTop: 8, borderRadius: 12, overflow: 'hidden' }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CenterTracker
            onMove={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
            }}
          />
        </MapContainer>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            fontSize: 32,
            lineHeight: 1,
          }}
        >
          📍
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onConfirm(lat, lng)}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
