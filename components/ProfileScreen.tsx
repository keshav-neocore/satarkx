
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Smartphone, Moon, Sun, Map as MapIcon, Globe, Save, Loader2, Edit2, Camera, Image as ImageIcon, Check, Dices, Sparkles, Trophy, Car, FileText } from 'lucide-react';
import { UserProfile, updateUserProfile, BADGES } from '../services/api';
import CameraModal from './CameraModal';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({ name: user.name, email: user.email, mobile: user.mobile || '' });
  const [theme, setTheme] = useState<'light' | 'dark'>(user.preferences.theme);
  const [mapStyle, setMapStyle] = useState<'simple' | 'satellite' | 'traffic'>(user.preferences.mapStyle);
  const [avatarType, setAvatarType] = useState<'upload' | 'preset'>(user.avatarType);
  const [gender, setGender] = useState<'boy' | 'girl'>(user.gender);
  const [presetId, setPresetId] = useState<string>(user.presetId);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | undefined>(user.avatarType === 'upload' ? user.avatarUrl : undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDiceBearUrl = (seed: string) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarType === 'preset' ? getDiceBearUrl(presetId) : customAvatarUrl;
      const updatedProfile = await updateUserProfile({
        name: formData.name, email: formData.email, mobile: formData.mobile,
        avatarType, gender, presetId, avatarUrl: finalAvatarUrl,
        preferences: { theme, mapStyle }
      });
      onUpdate(updatedProfile);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const latestBadgeId = user.badges && user.badges.length > 0 ? user.badges[user.badges.length - 1] : null;
  const latestBadge = latestBadgeId ? BADGES.find(b => b.id === latestBadgeId) : null;

  return (
    <div className={`pt-6 px-6 pb-32 h-full overflow-y-auto ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
      <div className="flex flex-col gap-6 max-w-lg mx-auto">
        <h2 className="text-2xl font-black flex items-center gap-2">
            <User className="text-mint-600" /> My Profile
        </h2>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mt-4 mb-2">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarMenu(true)}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-mint-400 via-accent-yellow to-mint-400 opacity-60 blur-md" />
                <div className="w-32 h-32 rounded-full border-[5px] border-white overflow-hidden shadow-2xl bg-white relative z-10">
                    <img src={avatarType === 'upload' ? customAvatarUrl : getDiceBearUrl(presetId)} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                {latestBadge && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -left-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-mint-50 z-20">
                        <span className="text-xl">{latestBadge.icon}</span>
                    </motion.div>
                )}
                <button onClick={(e) => { e.stopPropagation(); setShowAvatarMenu(true); }} className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full border-2 border-white z-20"><Edit2 size={14} /></button>
            </div>
            
            <p className="mt-5 font-black text-xl tracking-tight uppercase text-mint-700">{user.level}</p>
            
            <div className="mt-2 bg-white/50 px-4 py-1.5 rounded-full border border-mint-200/50 shadow-sm flex items-center gap-2">
                <FileText size={12} className="text-mint-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.reportCount} Reports Shared</p>
            </div>
        </div>

        {/* Badges Gallery */}
        <div className={`rounded-3xl p-6 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-mint-100 shadow-sm'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Trophy size={14} className="text-accent-yellow" /> Badges Earned
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2 px-1">
                {BADGES.map(badge => {
                    const isUnlocked = user.badges.includes(badge.id);
                    return (
                        <div key={badge.id} className={`flex flex-col items-center gap-2 min-w-[70px] ${isUnlocked ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 ${isUnlocked ? 'bg-mint-50 border-mint-200 shadow-sm' : 'bg-gray-100 border-transparent'}`}>
                                {badge.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter text-center">{badge.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Personal Details */}
        <div className={`rounded-3xl p-6 border space-y-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-mint-100 shadow-sm'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Personal Details</h3>
            <div className="space-y-4">
                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-1">NAME</label><div className="flex items-center rounded-2xl px-4 py-3 bg-gray-50 border border-gray-100"><User size={16} className="text-mint-500 mr-3" /><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-transparent w-full outline-none font-bold text-sm text-slate-700" /></div></div>
                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 ml-1">EMAIL</label><div className="flex items-center rounded-2xl px-4 py-3 bg-gray-50 border border-gray-100"><Mail size={16} className="text-mint-500 mr-3" /><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-transparent w-full outline-none font-bold text-sm text-slate-700" /></div></div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-bold text-slate-400">MOBILE NUMBER</label>
                    <span className="text-[8px] font-bold text-slate-400 opacity-60 bg-gray-100 px-1.5 py-0.5 rounded tracking-wide">OPTIONAL</span>
                  </div>
                  <div className="flex items-center rounded-2xl px-4 py-3 bg-gray-50 border border-gray-100">
                    <Smartphone size={16} className="text-mint-500 mr-3" />
                    <input type="tel" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} className="bg-transparent w-full outline-none font-bold text-sm text-slate-700" placeholder="+91" />
                  </div>
                </div>
            </div>
        </div>

        {/* App Settings */}
        <div className={`rounded-3xl p-6 border space-y-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-mint-100 shadow-sm'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Interface Preferences</h3>
            <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 ml-1">THEME</label>
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center py-2 rounded-lg gap-2 text-xs font-black transition-all ${theme === 'light' ? 'bg-white shadow-sm text-mint-600' : 'text-slate-400'}`}><Sun size={14} /> Light</button>
                        <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center py-2 rounded-lg gap-2 text-xs font-black transition-all ${theme === 'dark' ? 'bg-slate-800 shadow-sm text-white' : 'text-slate-400'}`}><Moon size={14} /> Dark</button>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 ml-1">MAP STYLE</label>
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button onClick={() => setMapStyle('simple')} className={`flex-1 flex items-center justify-center py-2 rounded-lg gap-1 text-xs font-black transition-all ${mapStyle === 'simple' ? 'bg-white shadow-sm text-mint-600' : 'text-slate-400'}`}><Globe size={14} /> Simple</button>
                        <button onClick={() => setMapStyle('satellite')} className={`flex-1 flex items-center justify-center py-2 rounded-lg gap-1 text-xs font-black transition-all ${mapStyle === 'satellite' ? 'bg-white shadow-sm text-mint-600' : 'text-slate-400'}`}><MapIcon size={14} /> Sat</button>
                        <button onClick={() => setMapStyle('traffic')} className={`flex-1 flex items-center justify-center py-2 rounded-lg gap-1 text-xs font-black transition-all ${mapStyle === 'traffic' ? 'bg-white shadow-sm text-mint-600' : 'text-slate-400'}`}><Car size={14} /> Traffic</button>
                    </div>
                </div>
            </div>
        </div>

        {/* Avatar Creator Settings */}
        <div className={`rounded-3xl p-6 border space-y-5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-mint-100 shadow-sm'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Guardian Avatar Generator</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 ml-1">PRESET ID</label>
                    <div className="flex items-center rounded-2xl px-4 py-2 bg-gray-50 border border-gray-100">
                        <input type="text" value={presetId} onChange={(e) => setPresetId(e.target.value)} className="bg-transparent w-full outline-none font-bold text-xs" />
                        <button onClick={() => setPresetId(Math.random().toString(36).substring(7))}><Dices size={14} className="text-mint-500 ml-2" /></button>
                    </div>
                </div>
                {/* Note: Gender specific generation is not strictly needed for this style but kept in state if we switch providers later */}
            </div>
            <p className="text-[9px] font-bold text-slate-400 italic">Avatar dynamically generated based on your Preset ID.</p>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="w-full bg-mint-600 text-white font-black py-4 rounded-2xl shadow-coin active:shadow-coin-pressed active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mb-8">{isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} {isSaving ? 'UPDATING...' : 'SAVE SETTINGS'}</button>
      </div>
      
      <AnimatePresence>
        {showAvatarMenu && (
          <AvatarMenu 
            onClose={() => setShowAvatarMenu(false)} 
            onSelect={(url) => { setCustomAvatarUrl(url); setAvatarType('upload'); setShowAvatarMenu(false); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AvatarMenu = ({ onClose, onSelect }: { onClose: () => void, onSelect: (url: string) => void }) => (
    <>
        <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-50 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-black text-xl text-slate-800">Change Guardian Avatar</h3>
            <button className="flex items-center gap-4 p-4 bg-mint-50 rounded-2xl border border-mint-100 font-bold text-mint-900 group active:scale-95 transition-all"><Camera className="group-hover:text-mint-600" /> Use Camera</button>
            <button className="flex items-center gap-4 p-4 bg-mint-50 rounded-2xl border border-mint-100 font-bold text-mint-900 group active:scale-95 transition-all"><ImageIcon className="group-hover:text-mint-600" /> From Gallery</button>
            <button onClick={onClose} className="mt-2 py-3 font-black text-slate-400 text-sm">Cancel</button>
        </motion.div>
    </>
);

export default ProfileScreen;
