import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Hazard } from '../services/api';
import { Layers, Check, Car, Globe, Map as MapIcon, Search, X, Loader2, Locate, Navigation, Clock, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  hazards: Hazard[];
  mapStyle: 'simple' | 'satellite' | 'traffic';
  onMapStyleChange: (style: 'simple' | 'satellite' | 'traffic') => void;
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
  onRecenter?: () => void;
  destination?: { lat: number; lng: number; name: string } | null;
  routeStats?: { time: string; dist: string } | null;
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

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, hazards, mapStyle, onMapStyleChange, onLocationSelect, onRecenter, destination, routeStats }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<any>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length > 2) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setSearchResults(data);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const selectLocation = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const name = result.display_name.split(',')[0];
    
    setSearchQuery(name);
    setSearchResults([]);
    
    if (onLocationSelect) {
      onLocationSelect(lat, lon, name);
    }
  };

  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 16);

      // User Marker
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

  // Update map view based on destination and user location
  useEffect(() => {
    if (!mapInstance.current) return;

    // Remove existing route and marker
    if (routeRef.current) {
        routeRef.current.remove();
        routeRef.current = null;
    }
    if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
    }

    if (destination) {
        // Create Destination Marker
        const destIcon = L.divIcon({
            className: 'custom-dest-icon',
            html: `<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });
        destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(mapInstance.current);

        // Generate Simulated Curved Route
        const start = { lat: latitude, lng: longitude };
        const end = { lat: destination.lat, lng: destination.lng };
        
        // Quadratic Bezier Curve Points (simplified for visual route)
        const controlPoint = {
            lat: (start.lat + end.lat) / 2 + (end.lng - start.lng) * 0.2, // Offset for curve
            lng: (start.lng + end.lng) / 2 + (end.lat - start.lat) * 0.2
        };

        const pathPoints: [number, number][] = [];
        for (let t = 0; t <= 1; t += 0.05) {
            const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlPoint.lat + t * t * end.lat;
            const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlPoint.lng + t * t * end.lng;
            pathPoints.push([lat, lng]);
        }

        // Add Polyline
        routeRef.current = L.polyline(pathPoints, {
            color: '#4CAF50', // Mint/Green for Safe Route
            weight: 5,
            opacity: 0.8,
            dashArray: '10, 10',
            lineCap: 'round'
        }).addTo(mapInstance.current);

        // Fit Bounds to show full route
        const bounds = L.latLngBounds([latitude, longitude], [destination.lat, destination.lng]);
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });

    } else {
        // Just recenter on user if no destination
        mapInstance.current.setView([latitude, longitude], 16);
    }

  }, [destination, latitude, longitude]);

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
        {/* Search Bar Overlay */}
        <div className="absolute top-2 left-2 right-2 z-[400]">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder={destination ? destination.name : "Search location..."} 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-white/90 backdrop-blur-md rounded-xl py-3 pl-10 pr-10 shadow-lg border border-white/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-mint-400 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-mint-500" />
              </div>
            )}
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 max-h-60 overflow-y-auto"
              >
                {searchResults.map((result, i) => (
                  <button 
                    key={i}
                    onClick={() => selectLocation(result)}
                    className="w-full text-left px-4 py-3 hover:bg-mint-50 flex items-start gap-2 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <MapIcon size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={mapContainer} className="w-full h-full z-0 bg-gray-200" />
        
        {/* Floating Route Info Card */}
        <AnimatePresence>
            {destination && routeStats && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-24 left-4 right-4 z-[400] bg-white rounded-3xl p-4 shadow-xl border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-mint-100 p-2 rounded-full text-mint-600">
                                <Navigation size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 leading-tight">Best Route</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Safest Path • Fewest Hazards</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-black text-mint-600">{routeStats.time}</span>
                            <span className="block text-[10px] font-bold text-slate-400">{routeStats.dist}</span>
                        </div>
                    </div>

                    {/* Timeline Visual */}
                    <div className="relative pt-2 pb-1 px-1">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 rounded-full -translate-y-1/2"></div>
                        <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-gradient-to-r from-mint-400 to-mint-600 rounded-full -translate-y-1/2"></div>
                        
                        <div className="relative flex justify-between items-center z-10">
                            {/* Start Node */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                                <span className="text-[9px] font-bold text-slate-400">You</span>
                            </div>

                             {/* Mid Checkpoint */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-mint-500 border-2 border-white shadow-sm"></div>
                            </div>

                            {/* Dest Node */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                                <span className="text-[9px] font-bold text-slate-400">End</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* Floating Controls */}
        <div className="absolute top-20 right-4 z-[400] flex flex-col items-end gap-2">
            
            {/* Layer Control Group */}
            <div className="relative">
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
                            initial={{ opacity: 0, scale: 0.9, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 10 }}
                            className="absolute top-0 right-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 w-32 origin-top-right"
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

            {/* Recenter Button */}
            <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => { 
                    setSearchQuery('');
                    if(onRecenter) onRecenter(); 
                }}
                className={`w-10 h-10 rounded-xl shadow-md border flex items-center justify-center transition-colors ${destination ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-100 text-slate-600 hover:text-mint-600'}`}
            >
                {destination ? <X size={20} /> : <Locate size={20} />}
            </motion.button>
        </div>
    </div>
  );
};

export default MapComponent;