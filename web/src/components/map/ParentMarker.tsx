'use client';

import { Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import polyline from '@mapbox/polyline';
import { Arrival } from '@/types';

interface ParentMarkerProps {
  arrival: Arrival;
  index: number;
  schoolLat: number;
  schoolLng: number;
}

function getMarkerColor(durationMinutes: number): string {
  if (durationMinutes < 5) return 'red';
  if (durationMinutes <= 15) return 'yellow';
  return 'green';
}

function createMarkerIcon(color: string): Icon {
  const markerSvg = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(markerSvg)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
}

export default function ParentMarker({
  arrival,
  index,
  schoolLat,
  schoolLng,
}: ParentMarkerProps) {
  if (!arrival.routePolyline) {
    return null;
  }

  let coordinates: [number, number][];
  try {
    const decoded = polyline.decode(arrival.routePolyline);
    coordinates = decoded.map(([lat, lng]) => [lat, lng] as [number, number]);
  } catch (error) {
    console.error('Failed to decode polyline:', error);
    return null;
  }

  if (coordinates.length === 0) {
    return null;
  }

  const parentPosition = coordinates[coordinates.length - 1];
  const color = getMarkerColor(arrival.durationMinutes);
  const icon = createMarkerIcon(color);

  const distanceKm = (arrival.distanceMeters / 1000).toFixed(1);

  return (
    <>
      <Polyline
        positions={coordinates}
        pathOptions={{ color: 'blue', weight: 3, opacity: 0.6 }}
      />
      <Marker position={parentPosition} icon={icon}>
        <Popup>
          <div className="text-sm">
            <div className="font-semibold">Pai #{index}</div>
            <div>ETA: {arrival.durationMinutes} min</div>
            <div>{distanceKm} km</div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
