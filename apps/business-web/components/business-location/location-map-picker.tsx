'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { QalaIcon } from '@qalago/brand/icons';
import 'leaflet/dist/leaflet.css';

type Props = {
  latitude: number;
  longitude: number;
  title: string;
  hint: string;
  mapLoadErrorLabel: string;
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
  title,
  hint,
  mapLoadErrorLabel,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const [lat, setLat] = useState(latitude);
  const [lng, setLng] = useState(longitude);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    setLat(latitude);
    setLng(longitude);
  }, [latitude, longitude]);

  return (
    <div className="bo-location-map-block">
      <h4 className="bo-location-map-block__title">{title}</h4>
      <p className="bo-location-map-block__hint">{hint}</p>
      {mapFailed ? (
        <p className="bo-field-error" role="alert">
          {mapLoadErrorLabel}
        </p>
      ) : (
        <div
          className="bo-location-map-frame"
          role="application"
          aria-label={title}
        >
          <MapContainer
            center={[latitude, longitude]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                tileerror: () => setMapFailed(true),
              }}
            />
            <CenterTracker
              onMove={(nextLat, nextLng) => {
                setLat(nextLat);
                setLng(nextLng);
              }}
            />
          </MapContainer>
          <div className="bo-location-map-pin" aria-hidden="true">
            <QalaIcon name="location" size="lg" />
          </div>
        </div>
      )}
      <p className="bo-field-helper" aria-live="polite">
        {lat.toFixed(6)}, {lng.toFixed(6)}
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onConfirm(lat, lng)}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
