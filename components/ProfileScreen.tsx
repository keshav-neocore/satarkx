import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Smartphone, Moon, Sun, Map as MapIcon, Globe, Save, Loader2, Edit2, Camera, Image as ImageIcon, X, Check, Dices, Sparkles, ChevronRight } from 'lucide-react';
import { UserProfile, updateUserProfile } from '../services/api';
import CameraModal from './CameraModal';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUpdate }) => {
  // Form State
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    mobile: user.mobile || '',
  });

  // Preferences State
  const [theme, setTheme] = useState<'light' | 'dark'>(user.preferences.theme);
  const [mapStyle, setMapStyle] = useState<'simple' | 'satellite'>(user.preferences.mapStyle);
  
  // Avatar State
  const [avatarType, setAvatarType] = useState<'upload' | 'preset'>(user.avatarType);
  const [gender, setGender] = useState<'boy' | 'girl'>(user.gender);
  const [presetId, setPresetId] = useState<string>(user.presetId);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | undefined>(user.avatarType === 'upload' ? user.avatarUrl : undefined);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants for Presets
  const PRESET_SEEDS = ['Felix', 'Aneka', 'Mark', 'Jocelyn', 'George', 'Maria', 'Christopher', 'Sophia', 'Ryker', 'Zoe'];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Determine final avatar URL
      let finalAvatarUrl = customAvatarUrl;
      if (avatarType === 'preset') {
        finalAvatarUrl = `https://avatar.iran.liara.run/public/${gender}?username=${presetId}`;
      }

      const updatedProfile = await updateUserProfile({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        avatarType,
        gender,
        presetId,
        avatarUrl: finalAvatarUrl,
        preferences: {
          theme,
          mapStyle
        }
      });
      onUpdate(updatedProfile);
    } catch (error) {
      console.error("Failed to save profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAvatarUrl(url);
      setAvatarType('upload');
      setShowAvatarMenu(false);
    }
  };

  const handleCameraCapture = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setCustomAvatarUrl(url);
    setAvatarType('upload');
    setShowCamera(false);
    setShowAvatarMenu(false);
  };

  const randomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setPresetId(randomSeed);
    setAvatarType('preset');
  };

  // Helper to render current avatar based on local state
  const getCurrentDisplayAvatar = () => {
    if (avatarType === 'upload' && customAvatarUrl) {
      return customAvatarUrl;
    }
    return `https://avatar.iran.liara.run/public/${gender}?username=${presetId}`;
  };

  return (
    <div className={`pt-6 px-6 pb-32 h-full overflow-y-auto ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
      <div className="flex flex-col gap-6 max-w-lg mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="text-mint-600" /> Profile & Settings
            </h2>
        </div>

        {/* --- 1. GAMIFIED AVATAR SECTION --- */}
        <div className="flex flex-col items-center mt-4 mb-2">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarMenu(true)}>
                {/* Animated Glow Ring */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-1 rounded-full bg-gradient-to-tr from-mint-400 via-accent-yellow to-mint-400 opacity-60 blur-md group-hover:opacity-80 transition-opacity"
                />
                
                {/* Main Avatar Circle */}
                <div className="w-32 h-32 rounded-full border-[5px] border-white ring-4 ring-mint-50 overflow-hidden shadow-2xl bg-white relative z-10 transition-transform group-hover:scale-[1.02]">
                    <img 
                        src={getCurrentDisplayAvatar()} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                    />
                </div>
                
                {/* Edit Button (Floating) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowAvatarMenu(true); }}
                    className="absolute top-0 right-0 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 active:scale-95 transition-all border-2 border-white z-20"
                >
                    <Edit2 size={14} />
                </button>

                {/* Rank Badge (Bottom Centered) */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-1 rounded-full text-[10px] font-bold border-2 border-white shadow-lg z-20 flex items-center gap-1 whitespace-nowrap">
                    <Sparkles size={10} className="text-accent-yellow" fill="#FFC107" />
                    <span>LVL {user.levelNumber}</span>
                </div>

                {/* Avatar Options Menu (Popover) */}
                <AnimatePresence>
                    {showAvatarMenu && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/20 z-30 backdrop-blur-[2px] cursor-default"
                                onClick={(e) => { e.stopPropagation(); setShowAvatarMenu(false); }}
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-2 z-40 w-52 flex flex-col gap-1 border border-gray-100"
                            >
                                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Change Photo</div>
                                <button onClick={(e) => { e.stopPropagation(); setShowCamera(true); }} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-mint-50 rounded-lg text-left text-sm font-bold text-slate-700 transition-colors">
                                    <div className="p-2 bg-mint-100 rounded-full text-mint-600"><Camera size={16} /></div>
                                    Take Photo
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-mint-50 rounded-lg text-left text-sm font-bold text-slate-700 transition-colors">
                                    <div className="p-2 bg-mint-100 rounded-full text-mint-600"><ImageIcon size={16} /></div>
                                    From Gallery
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
            
            <p className="mt-5 font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-mint-600 to-mint-800">{user.level}</p>
        </div>

        {/* --- STYLE SELECTOR --- */}
        <div className={`rounded-3xl p-6 border transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-mint-100 shadow-sm'}`}>
            
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">Customize Look</h3>

            {/* Gender Selection - Explicit Step */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {(['boy', 'girl'] as const).map((g) => {
                     const isActive = gender === g;
                     return (
                        <button
                            key={g}
                            onClick={() => { setGender(g); setAvatarType('preset'); }}
                            className={`relative py-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all duration-300 ${
                                isActive 
                                ? 'border-mint-500 bg-mint-50 text-mint-700 ring-2 ring-mint-200 ring-offset-1' 
                                : 'border-transparent bg-gray-50 text-slate-500 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-2xl">{g === 'boy' ? '👦' : '👧'}</span>
                            <span className="text-lg capitalize font-extrabold">{g}</span>
                            {isActive && (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-mint-500 rounded-full animate-pulse" />
                            )}
                        </button>
                     );
                })}
            </div>
            
            {/* Separator / Sub-label */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Style</span>
                <button onClick={randomizeAvatar} className="text-xs font-bold text-mint-600 flex items-center gap-1 hover:underline">
                    <Dices size={14} /> Randomize
                </button>
            </div>
            
            {/* Scrollable Preset Grid */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x">
                {PRESET_SEEDS.map((seed) => {
                    const isSelected = avatarType === 'preset' && presetId === seed;
                    return (
                        <button
                            key={seed}
                            onClick={() => { setPresetId(seed); setAvatarType('preset'); }}
                            className={`flex flex-col items-center gap-2 min-w-[64px] snap-start relative transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 bg-gray-100 transition-all duration-300 ${isSelected ? 'border-mint-500 ring-4 ring-mint-100 scale-105 shadow-lg' : 'border-transparent'}`}>
                                <img 
                                    src={`https://avatar.iran.liara.run/public/${gender}?username=${seed}`} 
                                    alt={seed} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                             {isSelected && (
                                <div className="absolute top-0 right-0 bg-mint-500 text-white rounded-full p-1 border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                                    <Check size={10} strokeWidth={4} />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* --- 2. USER INFO FORM --- */}
        <div className={`rounded-3xl p-6 border space-y-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-mint-100 shadow-sm'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Personal Details</h3>
            
            <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 opacity-70">Full Name</label>
                <div className={`flex items-center rounded-2xl px-4 py-3.5 border focus-within:border-mint-500 focus-within:ring-4 focus-within:ring-mint-50 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <User size={18} className="text-mint-500 mr-3" />
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="bg-transparent w-full outline-none font-bold text-sm"
                        placeholder="Your Name"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 opacity-70">Email</label>
                <div className={`flex items-center rounded-2xl px-4 py-3.5 border focus-within:border-mint-500 focus-within:ring-4 focus-within:ring-mint-50 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <Mail size={18} className="text-mint-500 mr-3" />
                    <input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="bg-transparent w-full outline-none font-bold text-sm"
                        placeholder="email@example.com"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold ml-1 opacity-70">Mobile <span className="font-normal opacity-50">(Optional)</span></label>
                <div className={`flex items-center rounded-2xl px-4 py-3.5 border focus-within:border-mint-500 focus-within:ring-4 focus-within:ring-mint-50 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <Smartphone size={18} className="text-mint-500 mr-3" />
                    <input 
                        type="tel" 
                        value={formData.mobile} 
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        className="bg-transparent w-full outline-none font-bold text-sm"
                        placeholder="+91 98765 43210"
                    />
                </div>
            </div>
        </div>

        {/* --- 3. APP SETTINGS --- */}
        <div className={`rounded-3xl p-6 border space-y-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-mint-100 shadow-sm'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Preferences</h3>
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-slate-900 text-yellow-400' : 'bg-orange-100 text-orange-500'}`}>
                        {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                    </div>
                    <div>
                        <p className="font-bold text-sm">App Theme</p>
                        <p className="text-xs opacity-60 font-semibold">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                    </div>
                </div>
                <div className="bg-gray-200 p-1 rounded-full flex w-16 relative cursor-pointer shadow-inner" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                    <motion.div 
                        layout 
                        className="w-7 h-7 bg-white rounded-full shadow-md"
                        animate={{ x: theme === 'light' ? 0 : 28 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                </div>
            </div>

            <div className={`w-full h-px ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'}`}></div>

            {/* Map Style Setting */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-500">
                        <MapIcon size={20} />
                    </div>
                    <p className="font-bold text-sm">Map Visualization</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setMapStyle('simple')}
                        className={`relative border-2 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all duration-300 ${mapStyle === 'simple' ? 'border-mint-500 bg-mint-50/50 shadow-sm' : 'border-transparent bg-gray-50 opacity-70 hover:opacity-100'}`}
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 shadow-inner">
                             <div className="w-full h-1/2 bg-gray-300 mt-auto"></div>
                        </div>
                        <span className={`text-xs font-bold ${mapStyle === 'simple' ? 'text-mint-700' : 'text-slate-500'}`}>Simple View</span>
                        {mapStyle === 'simple' && <div className="absolute top-3 right-3 w-2 h-2 bg-mint-500 rounded-full"></div>}
                    </button>

                    <button 
                         onClick={() => setMapStyle('satellite')}
                         className={`relative border-2 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all duration-300 ${mapStyle === 'satellite' ? 'border-mint-500 bg-mint-50/50 shadow-sm' : 'border-transparent bg-gray-50 opacity-70 hover:opacity-100'}`}
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-600 text-white shadow-inner">
                             <Globe size={20} />
                        </div>
                        <span className={`text-xs font-bold ${mapStyle === 'satellite' ? 'text-mint-700' : 'text-slate-500'}`}>Satellite View</span>
                        {mapStyle === 'satellite' && <div className="absolute top-3 right-3 w-2 h-2 bg-mint-500 rounded-full"></div>}
                    </button>
                </div>
            </div>
        </div>

        {/* --- SAVE BUTTON --- */}
        <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-mint-600 text-white font-bold py-4 rounded-2xl shadow-coin active:shadow-coin-pressed active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mb-8"
        >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>

      </div>

      {/* Camera Modal integration for Profile Photo */}
      <AnimatePresence>
        {showCamera && (
            <CameraModal 
                onClose={() => setShowCamera(false)}
                onCapture={(blob) => handleCameraCapture(blob)}
            />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfileScreen;