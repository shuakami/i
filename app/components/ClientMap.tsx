"use client";

import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

interface ClientMapProps {
  trackPoints: { latitude: number; longitude: number }[];
}

const A_MAP_KEY = "aee5b890b917bb3428b8175be74e6315";

const ClientMap: React.FC<ClientMapProps> = ({ trackPoints }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null); // To hold the map instance

    useEffect(() => {
        let map: any;
        AMapLoader.load({
            key: A_MAP_KEY,
            version: "2.0",
        }).then((AMap) => {
            if (!mapRef.current || mapInstanceRef.current) {
                return;
            }
            map = new AMap.Map(mapRef.current, {
                viewMode: '3D',
                zoom: 15,
                dragEnable: false,
                zoomEnable: false,
            });
            mapInstanceRef.current = map;

            const path = trackPoints.map(p => [p.longitude, p.latitude]);
            if (path.length > 0) {
                const polyline = new AMap.Polyline({
                    path: path,
                    strokeColor: "#2dd4bf",
                    strokeWeight: 6,
                    strokeStyle: "solid",
                });
                map.add(polyline);

                // Add start and end markers
                const startMarker = new AMap.CircleMarker({
                    center: path[0],
                    radius: 6,
                    strokeColor: "white",
                    strokeWeight: 2,
                    fillColor: "#22c55e", // green
                    fillOpacity: 1,
                    map: map,
                });
                const endMarker = new AMap.CircleMarker({
                    center: path[path.length - 1],
                    radius: 6,
                    strokeColor: "white",
                    strokeWeight: 2,
                    fillColor: "#ef4444", // red
                    fillOpacity: 1,
                    map: map,
                });
                
                map.setFitView();
            }
        }).catch(e => {
            console.error(e);
        });

        return () => {
            // Clean up: destroy the map instance
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, [trackPoints]); // Rerun effect if trackPoints change

    if (trackPoints.length === 0) {
        return (
            <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
                <p className="text-neutral-500">无轨迹记录</p>
            </div>
        );
    }
    
    return <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '1rem' }} />;
};

export default ClientMap; 