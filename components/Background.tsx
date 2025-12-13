import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
      {/* Abstract Map Lines */}
      <svg className="w-full h-full text-mint-200" viewBox="0 0 100 200" preserveAspectRatio="none">
        <path
          d="M-10,20 Q40,50 110,30"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <path
          d="M-10,40 Q60,80 110,60"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <path
          d="M-10,100 Q30,120 110,90"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <path
          d="M-10,150 Q70,140 110,170"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
         <path
          d="M20,0 Q50,50 30,200"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
         <path
          d="M80,0 Q60,100 90,200"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="4 2"
        />
        {/* Map Dots/POI markers */}
        <circle cx="20" cy="40" r="1.5" fill="#A5D6A7" />
        <circle cx="80" cy="120" r="1" fill="#A5D6A7" />
        <circle cx="50" cy="180" r="2" fill="#81C784" />
      </svg>
      
      {/* Soft Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-mint-50/80"></div>
    </div>
  );
};

export default Background;