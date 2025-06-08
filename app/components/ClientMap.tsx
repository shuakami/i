"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { useMemo } from "react";

interface ClientMapProps {
  trackPoints: { latitude: number; longitude: number }[];
}

const ClientMap: React.FC<ClientMapProps> = ({ trackPoints }) => {
  const positions = useMemo(() => 
    trackPoints.map(p => [p.latitude, p.longitude] as LatLngExpression),
    [trackPoints]
  );
  
  if (positions.length === 0) {
    return (
        <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
            <p className="text-neutral-500">无轨迹记录</p>
        </div>
    );
  }

  const startPoint = positions[0];
  const endPoint = positions[positions.length - 1];

  // Calculate map bounds
  const bounds = useMemo(() => {
    if (positions.length === 0) return undefined;
    const lats = positions.map(p => (p as [number, number])[0]);
    const lngs = positions.map(p => (p as [number, number])[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as [[number, number], [number, number]];
  }, [positions]);


  return (
    <MapContainer
      bounds={bounds}
      style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <Polyline positions={positions} color="#f97316" weight={4} />
      {startPoint && <Marker position={startPoint} />}
      {endPoint && <Marker position={endPoint} />}
    </MapContainer>
  );
};

export default ClientMap; 