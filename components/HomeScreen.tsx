import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Map as MapIcon, User as UserIcon, List, Zap, Trophy, Bot, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import MapComponent from './MapComponent';
import CameraModal from './CameraModal';
import ProfileScreen from './ProfileScreen';
import FeedScreen from './FeedScreen';
import RewardsScreen from './RewardsScreen';
import ReportsScreen from './ReportsScreen';
import ProfileHeaderButton from './ProfileHeaderButton';
import NetworkSimulationModal from './NetworkSimulationModal';
import { fetchUserProfile, fetchHazards, submitReport, UserProfile, Hazard } from '../services/api';
import { requestNotificationPermission, sendCriticalAlert, sendRewardNotification } from '../services/notifications';

const HomeScreen: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [activeTab, setActiveTab] = useState('Map');
  const [showCamera, setShowCamera] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIScanning, setIsAIScanning] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null);
  const [showNetworkSim, setShowNetworkSim] = useState(false);
  const [simStats, setSimStats] = useState({ accuracy: '>95%', timeSaved: '15m', reduction: '10%' });
  const [pendingPoints, setPendingPoints] = useState(0);
  
  // Notification Tracking
  const notifiedHazardsRef = useRef<Set<string>>(new Set());

  // Map Style Local State
  const [viewMapStyle, setViewMapStyle] = useState<'simple' | 'satellite' | 'traffic'>('simple');

  useEffect(() => {
    loadData();
    
    // Request Notification Permission on Mount
    requestNotificationPermission();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          refreshHazards(latitude, longitude);
        },
        () => {
          const fallback = { lat: 28.6139, lng: 77.2090 };
          setCurrentLocation(fallback);
          refreshHazards(fallback.lat, fallback.lng);
        }
      );
    }
  }, []);

  // Update view map style when user preferences load
  useEffect(() => {
    if (user?.preferences.mapStyle) {
        setViewMapStyle(user.preferences.mapStyle);
    }
  }, [user]);

  // Auto-hide toast
  useEffect(() => {
      if(uploadStatus) {
          const timer = setTimeout(() => setUploadStatus(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [uploadStatus]);

  // Periodic AI scanning simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentLocation) {
        setIsAIScanning(true);
        setTimeout(() => {
           refreshHazards(currentLocation.lat, currentLocation.lng);
           setIsAIScanning(false);
        }, 2000);
      }
    }, 15000); // Scan every 15 seconds
    return () => clearInterval(interval);
  }, [currentLocation]);

  const refreshHazards = async (lat: number, lng: number) => {
    const h = await fetchHazards(lat, lng);
    setHazards(h);
    
    // Check for new critical hazards to notify
    h.forEach(hazard => {
        if (hazard.severity === 'Critical' && !notifiedHazardsRef.current.has(String(hazard.id))) {
            sendCriticalAlert(hazard.title, hazard.description);
            notifiedHazardsRef.current.add(String(hazard.id));
        }
    });
  };

  const loadData = async () => {
      const u = await fetchUserProfile();
      setUser(u);
  };

  const handleCapture = async (mediaBlob: Blob, type: 'image' | 'video') => {
    setShowCamera(false);
    setIsSubmitting(true);
    if (currentLocation) {
        try {
            const result = await submitReport(mediaBlob, currentLocation.lat, currentLocation.lng, type);
            
            if (result.success) {
                // Instead of immediate success, trigger simulation
                if (result.impact) {
                    setSimStats(result.impact);
                }
                setPendingPoints(result.points_added);
                setShowNetworkSim(true);
                
            } else {
                setUploadStatus('error');
            }
        } catch (e) {
            setUploadStatus('error');
        }
    }
    setIsSubmitting(false);
  };

  const handleSimComplete = async () => {
      setShowNetworkSim(false);
      setUploadStatus('success');
      sendRewardNotification(pendingPoints);
      await loadData();
      if(currentLocation) refreshHazards(currentLocation.lat, currentLocation.lng);
  };

  if (!user || !currentLocation) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-mint-50">
            <div className="animate-spin text-mint-600"><Zap size={40} /></div>
        </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden font-sans ${user.preferences.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-100'}`}>
      
      {/* Header with AI Scanning indicator */}
      <div className={`absolute top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between backdrop-blur-md ${user.preferences.theme === 'dark' ? 'bg-slate-900/80 border-b border-slate-700' : 'bg-white/80 border-b border-mint-50'}`}>
          <ProfileHeaderButton user={user} onPress={() => setActiveTab('Profile')} />
          
          <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-mint-600">SatarkX</span>
              <AnimatePresence mode="wait">
                {isAIScanning ? (
                    <motion.div 
                        key="scanning"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1.5 text-purple-600"
                    >
                        <Bot size={10} className="animate-bounce" />
                        <span className="text-[9px] font-black uppercase tracking-tight">AI Scanning...</span>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="pulse"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-bold opacity-60">Live Pulse</span>
                    </motion.div>
                )}
              </AnimatePresence>
          </div>

          <motion.div whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-mint-50 px-3 py-1.5 rounded-full border border-mint-100 shadow-sm">
            <Zap size={14} className="text-yellow-500" fill="currentColor" />
            <span className="text-xs font-black text-mint-900">{user.currentPoints}</span>
          </motion.div>
      </div>

      <div className={`absolute inset-0 z-0 pt-20 pb-20 overflow-y-auto ${user.preferences.theme === 'dark' ? 'bg-slate-900' : 'bg-mint-50'}`}>
        {activeTab === 'Map' && currentLocation && (
            <div className="w-full h-full">
                <MapComponent 
                    latitude={currentLocation.lat} 
                    longitude={currentLocation.lng} 
                    hazards={hazards} 
                    mapStyle={viewMapStyle}
                    onMapStyleChange={setViewMapStyle} 
                />
            </div>
        )}
        {activeTab === 'Feed' && <FeedScreen />}
        {activeTab === 'Reports' && <ReportsScreen />}
        {activeTab === 'Rewards' && <RewardsScreen onPointsUpdated={loadData} />}
        {activeTab === 'Profile' && <ProfileScreen user={user} onUpdate={(u) => setUser(u)} />}
      </div>

      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCamera(true)} className="absolute bottom-24 right-6 z-20 group">
         <div className="absolute inset-0 bg-accent-dark rounded-full translate-y-2 opacity-40 blur-sm"></div>
         <div className="absolute inset-0 bg-accent-dark rounded-full translate-y-1"></div>
         <div className="relative w-20 h-20 bg-gradient-to-br from-accent-yellow to-yellow-500 rounded-full flex flex-col items-center justify-center shadow-2xl border-2 border-yellow-200">
            <Camera className="text-yellow-900 w-8 h-8 mb-0.5" strokeWidth={2.5} />
            <span className="text-[9px] font-black text-yellow-900 leading-tight text-center px-1">SNAP &<br/>REPORT</span>
         </div>
      </motion.button>

      <div className={`absolute bottom-0 left-0 right-0 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20 pb-safe pt-2 ${user.preferences.theme === 'dark' ? 'bg-slate-800 border-t border-slate-700' : 'bg-white'}`}>
         <div className="flex justify-around items-end pb-4">
            <NavIcon icon={MapIcon} label="Map" active={activeTab === 'Map'} onClick={() => setActiveTab('Map')} />
            <NavIcon icon={FileText} label="Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
            <NavIcon icon={List} label="Feed" active={activeTab === 'Feed'} onClick={() => setActiveTab('Feed')} />
            <NavIcon icon={Trophy} label="Rewards" active={activeTab === 'Rewards'} onClick={() => setActiveTab('Rewards')} />
            <NavIcon icon={UserIcon} label="Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
         </div>
      </div>

      <AnimatePresence>
          {isSubmitting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="bg-white p-6 rounded-2xl flex flex-col items-center shadow-xl">
                      <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-bold text-mint-900">Sending Report...</p>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
          {showNetworkSim && (
              <NetworkSimulationModal 
                 onComplete={handleSimComplete} 
                 stats={simStats}
              />
          )}
      </AnimatePresence>

      <AnimatePresence>
          {uploadStatus && (
              <motion.div 
                  initial={{ opacity: 0, y: -50 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -50 }} 
                  className={`absolute top-20 left-6 right-6 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${uploadStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                  {uploadStatus === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                  <div>
                      <h4 className="font-black text-sm">{uploadStatus === 'success' ? 'Report Verified!' : 'Upload Failed'}</h4>
                      <p className="text-xs opacity-80">{uploadStatus === 'success' ? 'Authorities & Navigation Apps Notified.' : 'Please check connection or try again.'}</p>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>{showCamera && <CameraModal onClose={() => setShowCamera(false)} onCapture={handleCapture} />}</AnimatePresence>
    </div>
  );
};

const NavIcon: React.FC<{ icon: React.ElementType; label: string; active?: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 transition-colors ${active ? 'text-mint-600' : 'text-slate-400'}`}>
        <Icon size={active ? 26 : 24} strokeWidth={active ? 2.5 : 2} />
        <span className={`text-[10px] font-bold ${active ? 'text-mint-600' : 'text-slate-400'}`}>{label}</span>
        {active && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-mint-600 rounded-full mt-0.5" />}
    </button>
);

export default HomeScreen;