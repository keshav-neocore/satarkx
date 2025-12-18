import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, MapPin, Zap, Medal } from 'lucide-react';
import { fetchLeaderboard, LeaderboardUser } from '../services/api';

const Leaderboard: React.FC = () => {
    const [top3, setTop3] = useState<LeaderboardUser[]>([]);
    const [nearby, setNearby] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard().then(data => {
            setTop3(data.top3);
            setNearby(data.nearby);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) return null;

    return (
        <section className="mt-8 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-accent-yellow" />
                <h3 className="font-bold text-slate-700">Guardian Leaderboard</h3>
            </div>

            {/* Podium (Top 3 Hazard Reporters) */}
            <div className="flex items-end justify-center gap-3 mb-10 pt-8 px-2">
                {/* 2nd Place */}
                <PodiumCard user={top3[1]} rank={2} color="bg-slate-300" height="h-32" />
                {/* 1st Place */}
                <PodiumCard user={top3[0]} rank={1} color="bg-accent-yellow" height="h-40" isMain />
                {/* 3rd Place */}
                <PodiumCard user={top3[2]} rank={3} color="bg-orange-400" height="h-28" />
            </div>

            {/* Nearby Guardians List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <MapPin size={10} /> Nearby Guardians
                    </h4>
                    <span className="text-[10px] font-bold text-mint-600">Top 15</span>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    {nearby.map((user, index) => (
                        <div 
                            key={user.id} 
                            className={`flex items-center justify-between p-4 ${index !== nearby.length - 1 ? 'border-b border-gray-50' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-300 w-4">{index + 4}</span>
                                <div className="relative">
                                    <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt={user.name} />
                                    <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[7px] font-bold px-1 rounded-full border border-white">
                                        L{user.level}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">{user.name}</p>
                                    <p className="text-[9px] font-bold text-mint-600 flex items-center gap-1">
                                        <MapPin size={8} /> {user.distance}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <Zap size={12} fill="currentColor" className="text-yellow-500" />
                                <span className="text-xs font-black">{user.points}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PodiumCard = ({ user, rank, color, height, isMain }: { user: LeaderboardUser, rank: number, color: string, height: string, isMain?: boolean }) => (
    <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`flex flex-col items-center relative flex-1 ${isMain ? 'z-10' : ''}`}
    >
        {isMain && (
            <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 text-accent-yellow"
            >
                <Crown size={24} fill="currentColor" />
            </motion.div>
        )}
        
        <div className={`relative mb-2 ${isMain ? 'scale-110' : ''}`}>
            <img 
                src={user.avatar} 
                className="w-14 h-14 rounded-full border-4 border-white shadow-lg" 
                alt={user.name} 
            />
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${color} text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-black text-[10px]`}>
                {rank}
            </div>
        </div>

        <div className={`w-full ${color} rounded-t-2xl ${height} flex flex-col items-center justify-center p-2 text-white shadow-lg`}>
            <p className="text-[10px] font-black uppercase tracking-tight text-center truncate w-full">{user.name}</p>
            <div className="flex items-center gap-0.5 mt-1">
                <Medal size={10} />
                <span className="text-[9px] font-black">{user.reports} REPORTS</span>
            </div>
        </div>
    </motion.div>
);

export default Leaderboard;
