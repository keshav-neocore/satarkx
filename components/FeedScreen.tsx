import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HazardHeroCard from './HazardHeroCard';
import FeedItem from './FeedItem'; // Remove { FeedData } import here as we import from api
import { Bell, Loader2 } from 'lucide-react';
import { fetchLivePulseFeed, FeedItemData } from '../services/api';

const FeedScreen: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      try {
        // Pass dummy lat/lng for now
        const data = await fetchLivePulseFeed(28.6139, 77.2090);
        setFeedItems(data);
      } catch (e) {
        console.error("Feed error", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeed();
  }, []);

  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-32">
       {/* Top Bar - Sticky */}
       <div className="bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-20 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
             </span>
             Live Pulse
          </h1>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-mint-700 bg-mint-100 px-3 py-1 rounded-full border border-mint-200 uppercase tracking-wide">New Delhi</span>
             <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-slate-600">
                <Bell size={20} />
                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
       </div>

       <div className="p-4 pt-4 max-w-lg mx-auto">
          {/* Hero Card - Static for now, could also be dynamic */}
          <HazardHeroCard 
             status="caution"
             location="New Delhi, NCR"
             message="Heavy rainfall alert issued for the next 4 hours. Low visibility in South District."
             timestamp="Updated 10:45 AM"
          />

          {/* Feed List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-mint-600 w-8 h-8 mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Pulse...</p>
            </div>
          ) : (
            <div className="flex flex-col">
               <AnimatePresence>
                 {feedItems.map((item, index) => (
                    <motion.div
                       key={item.id}
                       initial={{ opacity: 0, y: 30 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                    >
                       <FeedItem item={item} />
                    </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          )}
          
          {!isLoading && (
            <div className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">
               You're all caught up
            </div>
          )}
       </div>
    </div>
  );
};

export default FeedScreen;