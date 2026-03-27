'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Arrival } from '@/types';
import ParentMarker from './ParentMarker';
import 'leaflet/dist/leaflet.css';

interface ArrivalsMapProps {
  schoolLat: number;
  schoolLng: number;
  schoolName: string;
  arrivals: Arrival[];
}

const schoolIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
      <text x="16" y="20" font-size="16" fill="white" text-anchor="middle" font-weight="bold">S</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export default function ArrivalsMap({
  schoolLat,
  schoolLng,
  schoolName,
  arrivals,
}: ArrivalsMapProps) {
  return (
    <div className="w-full h-[260px] md:h-[400px] rounded-lg overflow-hidden shadow-md mb-6">
      <MapContainer
        center={[schoolLat, schoolLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[schoolLat, schoolLng]} icon={schoolIcon}>
          <Popup>
            <div className="text-sm font-semibold">{schoolName}</div>
          </Popup>
        </Marker>

        {arrivals.map((arrival, index) => (
          <ParentMarker
            key={arrival.parentId}
            arrival={arrival}
            index={index + 1}
            schoolLat={schoolLat}
            schoolLng={schoolLng}
          />
        ))}
      </MapContainer>
    </div>
  );
}
