import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Hazard } from '../services/api';
import { renderToString } from 'react-dom/server';
import { AlertTriangle } from 'lucide-react';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  hazards: Hazard[];
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, hazards }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      // Initialize Map
      mapInstance.current = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 16);

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Add User Location Marker (Blue Pulse)
      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstance.current);
    }
  }, []); // Run once on mount

  // Update View when location changes
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView([latitude, longitude], 16);
    }
  }, [latitude, longitude]);

  // Update Hazards
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    hazards.forEach(hazard => {
      const iconHtml = renderToString(<AlertTriangle color="white" size={20} />);
      const hazardIcon = L.divIcon({
        className: 'custom-hazard-icon',
        html: `<div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-md relative group">
                ${iconHtml}
                <div class="absolute -bottom-8 bg-white px-2 py-1 rounded shadow text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  ${hazard.title}
                </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon })
        .addTo(mapInstance.current!)
        .bindPopup(`<b>${hazard.title}</b><br>${hazard.type}`);
      
      markersRef.current.push(marker);
    });
  }, [hazards]);

  return <div ref={mapContainer} className="w-full h-full z-0" />;
};

export default MapComponent;