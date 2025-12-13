import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Map as MapIcon, FileText, User as UserIcon, List, Zap, Clock, CheckCircle } from 'lucide-react';
import MapComponent from './MapComponent';
import CameraModal from './CameraModal';
import { fetchUserProfile, fetchHazards, submitReport, fetchUserReports, UserProfile, Hazard, Report } from '../services/api';

const HomeScreen: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [activeTab, setActiveTab] = useState('Map');
  const [showCamera, setShowCamera] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);

  // 1. Load User & Location
  useEffect(() => {
    loadData();
    
    // Get Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          // Fetch Hazards near user
          fetchHazards(latitude, longitude).then(setHazards);
        },
        (error) => {
          console.error("Geo Error:", error);
          // Fallback location (e.g. New Delhi)
          const fallback = { lat: 28.6139, lng: 77.2090 };
          setCurrentLocation(fallback);
          fetchHazards(fallback.lat, fallback.lng).then(setHazards);
        }
      );
    }
  }, []);

  // Reload reports when tab changes to Reports
  useEffect(() => {
    if (activeTab === 'Reports') {
        fetchUserReports().then(setMyReports);
    }
  }, [activeTab]);

  const loadData = async () => {
      const u = await fetchUserProfile();
      setUser(u);
  };

  const handleCapture = async (mediaBlob: Blob, type: 'image' | 'video') => {
    setShowCamera(false);
    setIsSubmitting(true);
    
    // Simulate API call
    if (currentLocation) {
        await submitReport(mediaBlob, currentLocation.lat, currentLocation.lng, type);
        await loadData(); // Refresh points
        const points = type === 'video' ? 20 : 10;
        alert(`Report Submitted! +${points} Points`);
        
        // Refresh reports if needed immediately
        const reports = await fetchUserReports();
        setMyReports(reports);
    }
    
    setIsSubmitting(false);
  };

  if (!user || !currentLocation) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-mint-50">
            <div className="animate-spin text-mint-600"><Zap size={40} /></div>
        </div>
    );
  }

  const progressPercent = (user.currentPoints / user.maxPoints) * 100;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100 font-sans">
      
      {/* 1. Main Content Area (Map or Reports List) */}
      <div className="absolute inset-0 z-0 bg-mint-50 pb-20 overflow-y-auto">
        {activeTab === 'Map' && (
             <div className="w-full h-full">
                <MapComponent 
                    latitude={currentLocation.lat} 
                    longitude={currentLocation.lng} 
                    hazards={hazards} 
                />
             </div>
        )}

        {activeTab === 'Reports' && (
            <div className="pt-24 px-4 pb-20 min-h-full">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText className="text-mint-600" /> My Reports
                </h2>
                
                {myReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Camera size={48} className="mb-2 opacity-50" />
                        <p>No reports yet. Start Snapping!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {myReports.map((report) => (
                            <div key={report.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-mint-100">
                                <div className="relative h-48 bg-gray-100">
                                    {report.type === 'video' ? (
                                        <video src={report.url} controls className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={report.url} alt="Report" className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md font-bold uppercase">
                                        {report.type}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                                                {report.timestamp.toLocaleDateString()} • {report.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                            <p className="font-bold text-slate-700 text-sm">
                                                Location: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                                            <Clock size={12} />
                                            {report.status}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-mint-600 font-bold text-sm mt-2">
                                        <Zap size={14} fill="currentColor" />
                                        +{report.pointsEarned} EcoPoints Earned
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {/* Placeholder for other tabs */}
        {(activeTab === 'Feed' || activeTab === 'Profile') && (
             <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <List size={48} className="mb-2 opacity-20" />
                <p>Coming Soon</p>
             </div>
        )}
      </div>

      {/* 2. Floating Header Card (Always visible) */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 z-20 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-full bg-mint-100 overflow-hidden border-2 border-mint-500">
           <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
             <h2 className="text-sm font-bold text-slate-800">Level {user.levelNumber} {user.level}</h2>
             <span className="text-xs font-bold text-mint-600">{user.currentPoints}/{user.maxPoints} pts</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progressPercent}%` }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               className="h-full bg-gradient-to-r from-mint-400 to-mint-600 rounded-full"
             />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {user.maxPoints - user.currentPoints} EcoPoints to next tier.
          </p>
        </div>
      </motion.div>

      {/* 3. Floating Action Button (FAB) - Hidden on Reports tab for cleaner view? No, keep it. */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCamera(true)}
        className="absolute bottom-24 right-6 z-20 group"
      >
         <div className="absolute inset-0 bg-accent-dark rounded-full translate-y-2 opacity-40 blur-sm"></div>
         <div className="absolute inset-0 bg-accent-dark rounded-full translate-y-1"></div>
         <div className="relative w-20 h-20 bg-gradient-to-br from-accent-yellow to-yellow-500 rounded-full flex flex-col items-center justify-center shadow-2xl border-2 border-yellow-200">
            <Camera className="text-yellow-900 w-8 h-8 mb-0.5" strokeWidth={2.5} />
            <span className="text-[9px] font-black text-yellow-900 leading-tight text-center px-1">SNAP &<br/>REPORT</span>
         </div>
      </motion.button>

      {/* 4. Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20 pb-safe pt-2">
         <div className="flex justify-around items-end pb-4">
            <NavIcon icon={MapIcon} label="Map" active={activeTab === 'Map'} onClick={() => setActiveTab('Map')} />
            <NavIcon icon={List} label="Feed" active={activeTab === 'Feed'} onClick={() => setActiveTab('Feed')} />
            <NavIcon icon={FileText} label="Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
            <NavIcon icon={UserIcon} label="Profile" active={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
         </div>
      </div>

      {/* 5. Submitting Overlay */}
      <AnimatePresence>
        {isSubmitting && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm"
            >
                <div className="bg-white p-6 rounded-2xl flex flex-col items-center shadow-xl">
                    <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-mint-900">Sending Report...</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Camera Modal */}
      <AnimatePresence>
        {showCamera && (
            <CameraModal 
                onClose={() => setShowCamera(false)} 
                onCapture={handleCapture} 
            />
        )}
      </AnimatePresence>

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