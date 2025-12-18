import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Gift, Star, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { fetchUserRewards, Reward, claimReward, fetchUserProfile, UserProfile } from '../services/api';
import ScratchCard from './ScratchCard';
import Leaderboard from './Leaderboard';

interface RewardsScreenProps {
  onPointsUpdated: () => void;
}

const RewardsScreen: React.FC<RewardsScreenProps> = ({ onPointsUpdated }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rewardData, userData] = await Promise.all([
        fetchUserRewards(),
        fetchUserProfile()
      ]);
      setRewards(rewardData);
      setUser(userData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScratch = async (id: string) => {
    try {
      await claimReward(id);
      onPointsUpdated();
      const updatedRewards = await fetchUserRewards();
      setRewards(updatedRewards);
      const updatedUser = await fetchUserProfile();
      setUser(updatedUser);
    } catch (e) {
      console.error(e);
    }
  };

  const unscratched = rewards.filter(r => r.status === 'unscratched');

  return (
    <div className="pt-6 px-4 pb-32 min-h-full max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2 text-slate-800">
          <Trophy className="text-accent-yellow" fill="#FFC107" /> SatarkX Rewards
        </h2>
        <div className="bg-mint-100 text-mint-700 px-3 py-1 rounded-full text-xs font-bold border border-mint-200 uppercase">
          {unscratched.length} CARDS
        </div>
      </div>

      {/* Progress & Level Card */}
      {user && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl mb-8 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Star size={80} fill="white" />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs font-bold text-mint-400 uppercase tracking-widest mb-1">Level {user.levelNumber}</p>
                        <h3 className="text-xl font-black">{user.level}</h3>
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10 flex flex-col items-center">
                        <Sparkles className="text-yellow-400 mb-0.5" size={14} />
                        <span className="text-[10px] font-bold">{user.badges.length} Badges</span>
                    </div>
                </div>
                
                <div className="w-full bg-white/10 h-3 rounded-full mb-2 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(user.currentPoints / user.maxPoints) * 100}%` }}
                        className="h-full bg-gradient-to-r from-mint-400 to-accent-yellow"
                    />
                </div>
                <div className="flex justify-between text-[10px] font-bold opacity-60">
                    <span>{user.currentPoints} ECOPOINTS</span>
                    <span>{user.maxPoints} FOR NEXT LVL</span>
                </div>
            </div>
          </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-mint-600 w-10 h-10 mb-2" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing Rewards...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Scratch Cards Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
                <Gift size={18} className="text-red-500" />
                <h3 className="font-bold text-slate-700">Mystery Scratch Cards</h3>
            </div>
            {unscratched.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center text-center">
                    <AlertCircle size={32} className="text-gray-300 mb-3" />
                    <p className="text-gray-500 font-bold text-sm">No cards available!</p>
                    <p className="text-gray-400 text-[10px] px-6 mt-1 uppercase tracking-tight font-black">Report a hazard to get 3 instant cards</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {unscratched.slice(0, 4).map((reward) => (
                        <ScratchCard 
                            key={reward.id} 
                            reward={reward} 
                            onReveal={() => handleScratch(reward.id)} 
                        />
                    ))}
                </div>
            )}
          </section>

          {/* Leaderboard Section */}
          <Leaderboard />
        </div>
      )}
    </div>
  );
};

export default RewardsScreen;
