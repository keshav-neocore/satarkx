import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Hazard } from '../services/api';
import { Layers, Check, Car, Globe, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  hazards: Hazard[];
  mapStyle: 'simple' | 'satellite' | 'traffic';
  onMapStyleChange: (style: 'simple' | 'satellite' | 'traffic') => void;
}

const getHazardIconSvg = (isAI: boolean, isPredictive: boolean, color: string) => {
    // Basic SVG paths approximating Lucide icons
    const botPath = `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`;
    const alertPath = `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`;
    // Brain/Sparkle path for predictive
    const predictivePath = `<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>`;
    
    let path = alertPath;
    if (isPredictive) path = predictivePath;
    else if (isAI) path = botPath;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
};

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

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
      }).addTo(layerRef.current);
    
    } else if (mapStyle === 'traffic') {
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
      const isPredictive = !!hazard.isPredictive;
      
      // Violet for Predictive, Red for Critical, Orange for Warning
      let severityColor = hazard.severity === 'Critical' ? 'bg-red-600' : 'bg-orange-500';
      if (isPredictive) severityColor = 'bg-violet-500';

      const iconHtml = getHazardIconSvg(isAI, isPredictive, 'white');
      
      const pulseAnimation = isPredictive ? 'animate-ping duration-1000' : 'animate-ping';

      const hazardIcon = L.divIcon({
        className: 'custom-hazard-icon',
        html: `<div class="relative group">
                ${isAI ? `<div class="absolute -inset-3 ${severityColor} rounded-full opacity-20 ${pulseAnimation}"></div>` : ''}
                ${isPredictive ? `<div class="absolute -inset-1 border border-violet-400 rounded-full opacity-60 animate-spin" style="animation-duration: 3s"></div>` : ''}
                <div class="w-10 h-10 ${severityColor} rounded-full flex items-center justify-center border-2 border-white shadow-md relative z-10">
                  ${iconHtml}
                </div>
                <div class="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-[10px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <span class="${isPredictive ? 'text-violet-600' : (isAI ? 'text-purple-600' : 'text-slate-600')} uppercase">
                     ${isPredictive ? 'Predictive Analysis' : (isAI ? 'AI Detection' : 'User Report')}
                  </span><br/>
                  ${hazard.title}
                </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      // Construct Rich Popup Content
      let popupContent = '';

      if (isPredictive) {
           popupContent = `
            <div class="font-sans p-1 min-w-[160px]">
                <div class="flex items-center gap-1 mb-1">
                    <span class="text-[8px] bg-violet-100 text-violet-700 px-1 rounded font-bold uppercase tracking-wide">Future Forecast</span>
                </div>
                <b class="text-sm block leading-tight text-violet-800">${hazard.title}</b>
                <div class="w-full bg-gray-100 h-1 mt-1 mb-1 rounded-full overflow-hidden">
                    <div class="bg-violet-500 h-full" style="width: ${(hazard.probability || 0) * 100}%"></div>
                </div>
                <p class="text-xs text-slate-500 mt-1">${hazard.description}</p>
                <p class="text-[9px] font-bold text-violet-600 mt-1">Expected: ${hazard.predictionTime}</p>
            </div>`;
      } else if (isAI) {
           popupContent = `
            <div class="font-sans p-1 min-w-[160px]">
                <div class="flex items-center gap-1 mb-1">
                    <span class="text-[8px] bg-purple-100 text-purple-700 px-1 rounded font-bold uppercase">AI ANALYZED</span>
                </div>
                <b class="text-sm block leading-tight text-slate-800">${hazard.title}</b>
                <p class="text-xs text-slate-500 mt-1">${hazard.description}</p>
            </div>`;
      } else {
           // User Report with Image and Author
           popupContent = `
            <div class="font-sans min-w-[180px]">
                ${hazard.imageUrl ? `<div class="w-full h-24 bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                    <img src="${hazard.imageUrl}" class="w-full h-full object-cover" />
                    <div class="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-bold">LIVE SNAP</div>
                </div>` : ''}
                
                ${hazard.authorName ? `
                <div class="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                    <img src="${hazard.authorAvatar || 'https://api.dicebear.com/9.x/adventurer/svg?seed=fallback'}" class="w-6 h-6 rounded-full bg-gray-100 border border-gray-200" />
                    <div>
                        <p class="text-xs font-bold text-slate-800 leading-none">${hazard.authorName}</p>
                        <p class="text-[9px] text-mint-600 font-bold leading-none mt-0.5">Level ${hazard.authorLevel} Guardian</p>
                    </div>
                </div>` : ''}

                <div class="flex items-center gap-1 mb-0.5">
                   <span class="text-[9px] ${hazard.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'} px-1 rounded font-bold uppercase">${hazard.severity}</span>
                   <span class="text-[9px] text-slate-400 font-bold">${hazard.reportTime || 'Just now'}</span>
                </div>
                <b class="text-sm block leading-tight text-slate-800">${hazard.title}</b>
                <p class="text-xs text-slate-500 mt-0.5">${hazard.description}</p>
            </div>`;
      }

      const marker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon })
        .addTo(mapInstance.current!)
        .bindPopup(popupContent);
      
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