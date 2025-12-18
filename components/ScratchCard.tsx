import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Star } from 'lucide-react';
import { Reward } from '../services/api';

interface ScratchCardProps {
  reward: Reward;
  onReveal: () => void;
}

const ScratchCard: React.FC<ScratchCardProps> = ({ reward, onReveal }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const handlePress = () => {
    if (isRevealed) return;
    setIsRevealed(true);
    // Add small delay to allow animation to show before sync
    setTimeout(onReveal, 1200);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={handlePress}
      className="relative aspect-square cursor-pointer perspective-1000"
    >
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="hidden"
            initial={{ rotateY: 0 }}
            exit={{ rotateY: 180, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full bg-gradient-to-br from-slate-200 via-white to-slate-200 rounded-3xl shadow-lg border-4 border-white flex flex-col items-center justify-center relative overflow-hidden group"
          >
            {/* Holographic Overlays */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200 shadow-inner">
                <Star size={24} className="text-slate-300" fill="#E2E8F0" />
            </div>
            <p className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scratch Me</p>
            
            {/* Pattern */}
            <div className="absolute top-2 left-2 opacity-10"><Sparkles size={12} /></div>
            <div className="absolute bottom-2 right-2 opacity-10"><Sparkles size={12} /></div>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ rotateY: -180, opacity: 0, scale: 0.8 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            className="w-full h-full bg-gradient-to-br from-mint-400 to-mint-600 rounded-3xl shadow-2xl border-4 border-white flex flex-col items-center justify-center text-white relative overflow-hidden"
          >
            {/* Celebration Particles */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [1, 2, 0], opacity: [1, 1, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-yellow-400/20 rounded-full"
            />
            
            <div className="p-3 bg-white/20 rounded-full mb-1">
                <Zap size={28} className="text-yellow-300 animate-bounce" fill="white" />
            </div>
            <div className="text-center">
                <p className="text-[10px] font-black uppercase opacity-70">You Won</p>
                <p className="text-2xl font-black">+{reward.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest">EcoPoints</p>
            </div>
            
            <div className="absolute top-0 right-0 p-2"><Sparkles size={14} className="text-yellow-200" /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ScratchCard;
