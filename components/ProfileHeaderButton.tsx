import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import { UserProfile, BADGES } from '../services/api';

interface ProfileHeaderButtonProps {
  user: UserProfile | null;
  onPress: () => void;
}

const ProfileHeaderButton: React.FC<ProfileHeaderButtonProps> = ({ user, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const hasAvatar = !!user?.avatarUrl && !imageError;
  const latestBadgeId = user?.badges && user.badges.length > 0 ? user.badges[user.badges.length - 1] : null;
  const latestBadge = latestBadgeId ? BADGES.find(b => b.id === latestBadgeId) : null;

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onPress}
      className="relative flex items-center justify-center group"
      aria-label="View Profile"
    >
      {/* Outer Level Ring */}
      <div className="absolute -inset-1 bg-gradient-to-tr from-mint-400 via-accent-yellow to-mint-400 rounded-full opacity-40 blur-[2px] group-hover:opacity-70 transition-opacity animate-pulse" />
      
      {/* Avatar Container */}
      <div className="relative w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-mint-100 flex items-center justify-center">
        {hasAvatar ? (
          <img 
            src={user.avatarUrl} 
            alt={user.name} 
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <User size={20} className="text-mint-600" />
        )}

        {/* Shine glint */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
      
      {/* Motivated Badge Icon (Top Left Corner) */}
      {latestBadge && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -left-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 z-10"
          >
            <span className="text-[10px]">{latestBadge.icon}</span>
          </motion.div>
      )}

      {/* Level Indicator Badge (Bottom Right) */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 border-2 border-white rounded-full flex items-center justify-center shadow-sm z-10">
        <span className="text-[8px] font-black text-white">{user?.levelNumber || 1}</span>
      </div>
    </motion.button>
  );
};

export default ProfileHeaderButton;