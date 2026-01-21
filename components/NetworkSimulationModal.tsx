
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Radio, Siren, Navigation, Check, Zap, Server, Share2, Activity } from 'lucide-react';

interface NetworkSimulationModalProps {
  onComplete: () => void;
  stats: {
    accuracy: string;
    timeSaved: string;
    reduction: string;
  };
}

const NetworkSimulationModal: React.FC<NetworkSimulationModalProps> = ({ onComplete, stats }) => {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    // Stage 0: AI Verification (1.5s)
    const t1 = setTimeout(() => setStage(1), 1500);
    // Stage 1: Network Distribution (1.5s)
    const t2 = setTimeout(() => setStage(2), 3000);
    // Stage 2: Impact Summary (2s)
    const t3 = setTimeout(() => setStage(3), 5000);
    // Complete
    const t4 = setTimeout(onComplete, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden"
    >
      {/* Background Grid Animation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
         <motion.div 
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#3e3e3e,transparent)]" 
         />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        
        {/* STAGE 0: DATA INTEGRITY CHECK */}
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div 
              key="integrity"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-mint-500 blur-2xl opacity-20 animate-pulse"></div>
                <div className="w-24 h-24 rounded-full border-4 border-mint-500/30 flex items-center justify-center relative">
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                        className="absolute inset-0 rounded-full border-t-4 border-mint-500"
                    />
                    <Server size={40} className="text-mint-400" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">AI Verification</h3>
                <p className="text-mint-300 font-bold text-sm mt-1 uppercase tracking-widest">Cross-referencing Data...</p>
              </div>
              <div className="w-full bg-slate-800 h-14 rounded-2xl flex items-center px-4 border border-slate-700 relative overflow-hidden">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    className="absolute left-0 top-0 bottom-0 bg-mint-900/50"
                 />
                 <div className="relative flex justify-between w-full items-center z-10">
                    <span className="text-xs font-bold text-slate-400">INTEGRITY SCORE</span>
                    <span className="text-xl font-black text-mint-400">{stats.accuracy}</span>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 1: NETWORK DISTRIBUTION */}
          {stage === 1 && (
             <motion.div 
                key="network"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="flex flex-col items-center w-full"
             >
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.5)] mb-8 relative">
                    <Radio size={32} className="text-white animate-pulse" />
                    <motion.div 
                        animate={{ scale: [1, 3], opacity: [0.5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border border-blue-400"
                    />
                </div>
                
                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider">Broadcasting Alert</h3>
                
                <div className="grid grid-cols-1 gap-3 w-full">
                    <NetworkNode icon={Navigation} label="Navigation Apps" color="text-green-400" delay={0.1} />
                    <NetworkNode icon={Siren} label="Emergency Services" color="text-red-400" delay={0.3} />
                    <NetworkNode icon={Share2} label="Civic Grid" color="text-yellow-400" delay={0.5} />
                </div>
             </motion.div>
          )}

          {/* STAGE 2: IMPACT STATS */}
          {stage === 2 && (
             <motion.div 
                key="impact"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="flex flex-col items-center text-center space-y-6"
             >
                <div className="w-24 h-24 bg-gradient-to-tr from-accent-yellow to-orange-500 rounded-3xl rotate-3 flex items-center justify-center shadow-2xl mb-2">
                    <Zap size={48} className="text-white fill-white" />
                </div>
                
                <div>
                   <h2 className="text-3xl font-black text-white italic">IMPACT CONFIRMED</h2>
                   <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">Instant Alert Network</p>
                </div>

                <div className="flex gap-4 w-full">
                    <div className="flex-1 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                        <Activity className="text-green-400 mb-2" size={20} />
                        <div className="text-2xl font-black text-white">{stats.timeSaved}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Est. Time Saved</div>
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                        <ShieldCheck className="text-blue-400 mb-2" size={20} />
                        <div className="text-2xl font-black text-white">{stats.reduction}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Risk Reduction</div>
                    </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

const NetworkNode = ({ icon: Icon, label, color, delay }: { icon: any, label: string, color: string, delay: number }) => (
    <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay }}
        className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 w-full"
    >
        <div className="flex items-center gap-4">
            <Icon size={20} className={color} />
            <span className="font-bold text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Sent</span>
            <div className="bg-green-500 rounded-full p-0.5"><Check size={10} className="text-white" strokeWidth={4} /></div>
        </div>
    </motion.div>
);

export default NetworkSimulationModal;
