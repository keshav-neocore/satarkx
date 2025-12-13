import React from 'react';
import { motion } from 'framer-motion';

// The "Made in India" Lion Capital simplified
export const LionLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    {/* Base */}
    <path d="M30 90 L70 90 L65 80 L35 80 Z" fill="#FF9933" stroke="none" /> 
    <path d="M35 80 L65 80" stroke="#138808" strokeWidth="2" />
    
    {/* Pillars/Lions Abstract */}
    <path d="M35 80 Q30 50 20 40 Q30 35 40 45" stroke="#FF9933" /> {/* Left Lion */}
    <path d="M65 80 Q70 50 80 40 Q70 35 60 45" stroke="#FF9933" /> {/* Right Lion */}
    <path d="M40 80 L40 45 Q50 30 60 45 L60 80" stroke="#FF9933" /> {/* Center */}
    
    {/* Wheel (Chakra) hint */}
    <circle cx="50" cy="85" r="3" fill="#000080" stroke="none" />
  </svg>
);

// The Main App Logo (Shield)
export const SatarkShield: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
        <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Shield Body */}
      <path 
        d="M50 95 C20 80 10 60 10 30 L50 10 L90 30 C90 60 80 80 50 95 Z" 
        fill="url(#shieldGrad)" 
      />
      {/* Glossy Sheen */}
      <path 
        d="M50 95 C20 80 10 60 10 30 L50 10 L90 30 C90 35 88 40 85 45 C80 20 20 40 50 95 Z" 
        fill="url(#sheen)" 
        opacity="0.5"
      />
      {/* Checkmark / X hybrid stylized */}
      <motion.path 
        d="M35 50 L45 60 L65 40" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
      />
    </svg>
  </div>
);

export const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);
