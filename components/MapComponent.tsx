import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Hazard } from '../services/api';
import { renderToString } from 'react-dom/server';
import { AlertTriangle, Bot, Layers, Check, Car, Globe, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  hazards: Hazard[];
  mapStyle: 'simple' | 'satellite' | 'traffic';
  onMapStyleChange: (style: 'simple' | 'satellite' | 'traffic') => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, hazards, mapStyle, onMapStyleChange }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 16);

      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstance.current);
    }
  }, []); 

  useEffect(() => {
    if (!mapInstance.current) return;

    if (layerRef.current) {
      layerRef.current.clearLayers();
    } else {
      layerRef.current = L.layerGroup().addTo(mapInstance.current);
    }

    if (mapStyle === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri'
      }).addTo(layerRef.current);

      // Add labels overlay for better usability
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
      }).addTo(layerRef.current);
    
    } else if (mapStyle === 'traffic') {
        // Using Google Maps Traffic Layer (Note: Requires internet, valid for prototyping)
        // Alternatively could use a dark map style to represent "night/traffic" mode visually
        L.tileLayer('https://mt0.google.com/vt/lyrs=m,traffic&hl=en&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: 'Google'
        }).addTo(layerRef.current);

    } else {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: 'CartoDB'
      }).addTo(layerRef.current);
    }
  }, [mapStyle]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView([latitude, longitude], 16);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    hazards.forEach(hazard => {
      const isAI = hazard.source === 'AI';
      const severityColor = hazard.severity === 'Critical' ? 'bg-red-600' : 'bg-orange-500';
      
      const iconHtml = renderToString(
        isAI 
          ? <Bot color="white" size={20} /> 
          : <AlertTriangle color="white" size={20} />
      );

      const hazardIcon = L.divIcon({
        className: 'custom-hazard-icon',
        html: `<div class="relative group">
                ${isAI ? `<div class="absolute -inset-2 ${severityColor} rounded-full opacity-20 animate-ping"></div>` : ''}
                <div class="w-10 h-10 ${severityColor} rounded-full flex items-center justify-center border-2 border-white shadow-md relative z-10">
                  ${iconHtml}
                </div>
                <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-[10px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <span class="${isAI ? 'text-purple-600' : 'text-slate-600'} uppercase">${isAI ? 'AI Detection' : 'User Report'}</span><br/>
                  ${hazard.title}
                </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon })
        .addTo(mapInstance.current!)
        .bindPopup(`
          <div class="font-sans p-1">
            <div class="flex items-center gap-1 mb-1">
              ${isAI ? '<span class="text-[8px] bg-purple-100 text-purple-700 px-1 rounded font-bold">AI ANALYZED</span>' : ''}
              <span class="text-[8px] font-bold uppercase ${hazard.severity === 'Critical' ? 'text-red-600' : 'text-orange-600'}">${hazard.severity}</span>
            </div>
            <b class="text-sm block">${hazard.title}</b>
            <p class="text-xs text-slate-500 mt-1">${hazard.description || hazard.type}</p>
          </div>
        `);
      
      markersRef.current.push(marker);
    });
  }, [hazards]);

  const toggleOption = (style: 'simple' | 'satellite' | 'traffic') => {
    onMapStyleChange(style);
    setShowLayerMenu(false);
  };

  return (
    <div className="relative w-full h-full">
        <div ref={mapContainer} className="w-full h-full z-0 bg-gray-200" />
        
        {/* Floating Layer Toggle */}
        <div className="absolute top-20 right-4 z-[400] flex flex-col items-end">
            <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLayerMenu(!showLayerMenu)}
                className="w-10 h-10 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-slate-600 hover:text-mint-600 transition-colors"
            >
                <Layers size={20} />
            </motion.button>

            <AnimatePresence>
                {showLayerMenu && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 w-32 origin-top-right"
                    >
                        <button 
                            onClick={() => toggleOption('simple')} 
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors ${mapStyle === 'simple' ? 'bg-mint-50 text-mint-700' : 'hover:bg-gray-50 text-slate-500'}`}
                        >
                            <MapIcon size={14} /> Standard
                            {mapStyle === 'simple' && <Check size={12} className="ml-auto" />}
                        </button>
                        <button 
                            onClick={() => toggleOption('satellite')} 
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors ${mapStyle === 'satellite' ? 'bg-mint-50 text-mint-700' : 'hover:bg-gray-50 text-slate-500'}`}
                        >
                            <Globe size={14} /> Satellite
                            {mapStyle === 'satellite' && <Check size={12} className="ml-auto" />}
                        </button>
                        <button 
                            onClick={() => toggleOption('traffic')} 
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors ${mapStyle === 'traffic' ? 'bg-mint-50 text-mint-700' : 'hover:bg-gray-50 text-slate-500'}`}
                        >
                            <Car size={14} /> Traffic
                            {mapStyle === 'traffic' && <Check size={12} className="ml-auto" />}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default MapComponent;