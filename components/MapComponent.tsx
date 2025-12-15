import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Hazard } from '../services/api';
import { renderToString } from 'react-dom/server';
import { AlertTriangle } from 'lucide-react';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  hazards: Hazard[];
  mapStyle: 'simple' | 'satellite';
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, hazards, mapStyle }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 16);

      // Add User Location Marker (Blue Pulse)
      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstance.current);
    }
  }, []); 

  // Handle Tile Layer Switching
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear previous layers
    if (layerRef.current) {
      layerRef.current.clearLayers();
    } else {
      layerRef.current = L.layerGroup().addTo(mapInstance.current);
    }

    if (mapStyle === 'satellite') {
      // 1. Satellite Base (Esri)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
      }).addTo(layerRef.current);

      // 2. Labels Overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
      }).addTo(layerRef.current);
    } else {
      // Simple View (CartoDB Positron - Light & Clean)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(layerRef.current);
    }

  }, [mapStyle]);

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

  return <div ref={mapContainer} className="w-full h-full z-0 bg-gray-200" />;
};

export default MapComponent;