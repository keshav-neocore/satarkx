import React, { useRef, useEffect, useState } from 'react';
import { BadgeCheck, Share2, MessageCircle, Heart, Volume2, VolumeX, Play, MoreHorizontal, ExternalLink, AlertCircle } from 'lucide-react';
import { FeedItemData } from '../services/api';

const FeedItem: React.FC<{ item: FeedItemData }> = ({ item }) => {
  switch (item.type) {
    case 'news': return <NewsItem item={item} />;
    case 'official': return <OfficialItem item={item} />;
    case 'reel': return <ReelItem item={item} />;
    case 'ad': return <AdItem item={item} />;
    default: return null;
  }
};

const NewsItem = ({ item }: { item: FeedItemData }) => (
  <div className="bg-white rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 mb-5">
    <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
            <img src={item.avatar} alt={item.author} className="w-10 h-10 rounded-full bg-gray-100 object-cover ring-2 ring-white" />
            <div>
                <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-800 text-sm">{item.author}</h3>
                {item.verified && <BadgeCheck size={14} className="text-blue-500 fill-blue-50" />}
                </div>
                <p className="text-xs text-slate-400 font-medium">{item.timestamp}</p>
            </div>
        </div>
        <button className="text-gray-400">
            <MoreHorizontal size={20} />
        </button>
    </div>
    
    <p className="text-slate-700 text-sm mb-3 leading-relaxed font-medium">{item.content}</p>
    
    {item.image && (
      <div className="rounded-2xl overflow-hidden mb-3 border border-gray-100 shadow-sm">
        <img src={item.image} className="w-full h-48 object-cover" alt="Post content" />
      </div>
    )}
    <FeedActions likes={item.likes} />
  </div>
);

const OfficialItem = ({ item }: { item: FeedItemData }) => (
  <div className="bg-blue-50/60 rounded-3xl p-5 shadow-sm border border-blue-100 mb-5 relative overflow-hidden group">
     <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
     <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-blue-50">
                <img src={item.avatar} alt="Official" className="w-8 h-8 object-contain" />
            </div>
            <div>
                <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-800 text-sm">{item.author}</h3>
                <BadgeCheck size={16} className="text-blue-600 fill-white" />
                </div>
                <span className="text-[10px] uppercase font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-sm inline-block mt-0.5">Official Update</span>
            </div>
        </div>
        <span className="text-xs font-bold text-slate-400">{item.timestamp}</span>
    </div>
    
    <div className="pl-2">
        <p className="text-slate-800 text-sm font-semibold leading-relaxed">{item.content}</p>
        <div className="mt-4 flex justify-end">
            <button className="text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                View Official Order <ExternalLink size={12} />
            </button>
        </div>
    </div>
  </div>
);

const ReelItem = ({ item }: { item: FeedItemData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasError) {
          videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 } // Play when 60% visible
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [hasError]);

  const togglePlay = () => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  if (hasError) {
    return (
        <div className="relative rounded-3xl overflow-hidden aspect-[9/16] mb-5 bg-slate-900 shadow-lg border border-gray-100 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={40} className="text-slate-600 mb-2" />
            <p className="text-slate-400 font-bold text-sm">Video Unavailable</p>
            <p className="text-slate-600 text-xs mt-1">The source content could not be loaded.</p>
            
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white bg-black/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                    <img src={item.avatar} className="w-9 h-9 rounded-full border-2 border-white/50" />
                    <div className="flex flex-col text-left">
                        <span className="font-bold text-sm text-white drop-shadow-md">{item.author}</span>
                        <span className="text-[10px] bg-red-500/50 px-1.5 py-0.5 rounded font-bold uppercase inline-block w-fit">Error</span>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden aspect-[9/16] mb-5 bg-black shadow-lg shadow-slate-200 border border-gray-100">
       <video 
         ref={videoRef}
         src={item.videoUrl}
         className="w-full h-full object-cover"
         loop
         muted={isMuted}
         playsInline
         onClick={togglePlay}
         onError={(e) => {
             console.error("Video load error", e);
             setHasError(true);
         }}
       />
       {/* Overlays */}
       <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none"></div>
       
       {/* Controls */}
       <button onClick={() => setIsMuted(!isMuted)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white backdrop-blur-md border border-white/20">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
       </button>
       
       {!isPlaying && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="bg-white/20 p-5 rounded-full backdrop-blur-sm border border-white/30">
             <Play size={32} fill="white" className="text-white ml-1" />
           </div>
         </div>
       )}

       <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
             <img src={item.avatar} className="w-9 h-9 rounded-full border-2 border-white/50" />
             <div className="flex flex-col">
                 <span className="font-bold text-sm text-white drop-shadow-md">{item.author}</span>
                 <span className="text-[10px] bg-red-500 px-1.5 py-0.5 rounded font-bold uppercase inline-block w-fit">Live Report</span>
             </div>
          </div>
          <p className="text-sm opacity-95 line-clamp-2 drop-shadow-md font-medium leading-relaxed">{item.content}</p>
       </div>
    </div>
  );
};

const AdItem = ({ item }: { item: FeedItemData }) => (
  <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-4 shadow-sm border border-dashed border-gray-300 mb-5">
     <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
           <div className="bg-white p-1 rounded-lg border shadow-sm">
             <img src={item.avatar} className="w-6 h-6 object-contain" />
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700">{item.author}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wide font-bold">Sponsored</span>
           </div>
        </div>
        <ExternalLink size={14} className="text-slate-400" />
     </div>
     <div className="rounded-2xl overflow-hidden my-2 relative group cursor-pointer">
        <img src={item.image} className="w-full h-40 object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute bottom-3 right-3 bg-white/90 px-3 py-1.5 text-[10px] font-bold rounded-lg shadow-sm text-slate-800 backdrop-blur-sm">
           Shop Now
        </div>
     </div>
     <p className="text-slate-600 text-sm font-medium">{item.content}</p>
  </div>
);

const FeedActions = ({ likes = 0 }) => (
  <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-50">
    <button className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 transition-colors text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-full">
       <Heart size={16} className={likes > 0 ? "fill-red-500 text-red-500" : ""} /> {likes}
    </button>
    <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-500 transition-colors text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-full">
       <MessageCircle size={16} /> Comment
    </button>
    <button className="text-slate-500 hover:text-mint-600 bg-slate-50 p-1.5 rounded-full">
       <Share2 size={18} />
    </button>
  </div>
);

export default FeedItem;