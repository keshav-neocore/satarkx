import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface HazardHeroCardProps {
  status: 'danger' | 'caution' | 'safe';
  location: string;
  message: string;
  timestamp: string;
}

const HazardHeroCard: React.FC<HazardHeroCardProps> = ({ status, location, message, timestamp }) => {
  const config = {
    danger: {
      bg: 'bg-gradient-to-r from-red-600 to-red-500',
      icon: ShieldAlert,
      textColor: 'text-white',
      badge: 'bg-red-800 text-red-100'
    },
    caution: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-400',
      icon: AlertTriangle,
      textColor: 'text-white',
      badge: 'bg-yellow-700 text-yellow-100'
    },
    safe: {
      bg: 'bg-gradient-to-r from-green-600 to-green-500',
      icon: CheckCircle,
      textColor: 'text-white',
      badge: 'bg-green-800 text-green-100'
    }
  }[status];

  const Icon = config.icon;

  return (
    <div className={`w-full p-5 rounded-3xl shadow-lg relative overflow-hidden ${config.bg} mb-6 transform transition-all hover:scale-[1.01]`}>
      {/* Pulse Animation Background */}
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute -left-10 bottom-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1 mr-4">
           <div className="flex items-center gap-2 mb-2">
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${config.badge}`}>
               <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
               {status === 'danger' ? 'Critical Alert' : status === 'caution' ? 'Advisory' : 'All Clear'}
             </span>
             <span className="flex items-center gap-1 text-white/80 text-xs font-semibold">
               <Clock size={10} /> {timestamp}
             </span>
           </div>
           <h2 className="text-2xl font-extrabold text-white leading-tight mb-1 drop-shadow-sm">{location}</h2>
           <p className="text-white/95 text-sm font-medium leading-snug">{message}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
          <Icon size={32} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default HazardHeroCard;