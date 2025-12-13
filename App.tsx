import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Mail, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import Background from './components/Background';
import { LionLogo, SatarkShield, GoogleIcon } from './components/Logos';
import InputField from './components/InputField';
import { loginUser } from './services/api';
import HomeScreen from './components/HomeScreen';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashPhase, setSplashPhase] = useState<'lion' | 'shield'>('lion');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Animation Sequence Logic
  useEffect(() => {
    // Check for existing session (optional, skipping for demo flow)
    const timer1 = setTimeout(() => {
      setSplashPhase('shield');
    }, 2000);

    const timer2 = setTimeout(() => {
      setShowSplash(false);
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleLoginSuccess = () => {
      setIsLoggedIn(true);
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center font-sans overflow-hidden bg-mint-100">
      
      <AnimatePresence mode='wait'>
        {showSplash ? (
          <motion.div
            key="splash"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
             <Background />
            {/* Phase 1: Made in India Lion */}
            <AnimatePresence mode='wait'>
              {splashPhase === 'lion' && (
                <motion.div
                  key="lion-container"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                  transition={{ duration: 0.8 }}
                  className="flex flex-col items-center z-10"
                >
                  <LionLogo className="w-32 h-32 mb-4" />
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-white to-green-600"
                    style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    Made in India
                  </motion.h2>
                </motion.div>
              )}

              {/* Phase 2: SatarkX Shield */}
              {splashPhase === 'shield' && (
                <motion.div
                  key="shield-container"
                  className="flex flex-col items-center z-10"
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                   {/* LayoutId allows Framer to animate this component into the next view's position */}
                  <motion.div layoutId="main-logo-wrapper" className="w-40 h-40">
                    <SatarkShield className="w-full h-full" />
                  </motion.div>
                  <motion.h1 
                    layoutId="app-title"
                    className="mt-6 text-4xl font-extrabold text-mint-900 tracking-tight"
                  >
                    SatarkX
                  </motion.h1>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : isLoggedIn ? (
            <HomeScreen />
        ) : (
          <>
            <Background />
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!username || !email) {
      setError("Please fill in both User Name and Email Address.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Save to Local Storage (Backup/Cache)
      const userData = {
        username,
        email,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('satarkx_user', JSON.stringify(userData));

      // 2. Send to Backend
      const response = await loginUser(username, email);
      
      console.log("Backend Response:", response);
      // alert(`Login Successful!\nServer ID: ${response.id}\nUser: ${username}`);
      
      onLoginSuccess();
      
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="relative z-10 w-full max-w-md px-8 h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* HEADER SECTION - Animates in from splash */}
      <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-4">
        <motion.div 
          layoutId="main-logo-wrapper" 
          className="w-28 h-28 mb-4 filter drop-shadow-xl"
        >
          <SatarkShield className="w-full h-full" />
        </motion.div>
        <motion.h1 
          layoutId="app-title"
          className="text-3xl font-extrabold text-mint-900 tracking-tight"
        >
          SatarkX
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-mint-600 font-semibold mt-2"
        >
          Navigate Safe. Stay Alert.
        </motion.p>
      </div>

      {/* INPUT SECTION */}
      <div className="flex-[2] flex flex-col justify-start space-y-6">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
           className={isLoading ? 'opacity-70 pointer-events-none' : ''}
        >
          <InputField 
            label="User Name" 
            icon={User} 
            placeholder="Explorer123"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if(error) setError(null);
            }}
          />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.5 }}
           className={isLoading ? 'opacity-70 pointer-events-none' : ''}
        >
          <InputField 
            label="Email Address" 
            type="email"
            icon={Mail} 
            placeholder="hello@satarkx.in"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if(error) setError(null);
            }}
          />
        </motion.div>
        
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm font-bold"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full relative group disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {/* The 3D Coin Effect Depth */}
            <div className="absolute inset-0 bg-mint-800 rounded-full translate-y-1 group-active:translate-y-0 transition-transform duration-100 ease-out"></div>
            {/* The Main Button Face */}
            <div className="relative bg-gradient-to-r from-mint-400 to-mint-600 text-white font-bold text-lg py-4 rounded-full shadow-lg border border-mint-300 group-active:translate-y-1 transition-transform duration-100 ease-out flex items-center justify-center gap-2">
               {isLoading ? (
                 <>
                  <Loader2 className="animate-spin" />
                  LOGGING IN...
                 </>
               ) : (
                 <>
                   LOGIN
                   <span className="bg-white/20 rounded-full p-1">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                   </span>
                 </>
               )}
            </div>
            {/* Shine/Gloss effect */}
            <div className="absolute top-1 left-4 right-4 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none"></div>
          </button>
        </motion.div>

        {/* SOCIAL LOGIN */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`space-y-4 pt-2 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-mint-200"></div>
            <span className="flex-shrink-0 mx-4 text-mint-500 font-semibold text-sm">Or join with</span>
            <div className="flex-grow border-t border-mint-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-white border-2 border-mint-100 rounded-xl py-3 shadow-sm active:scale-95 transition-transform">
              <GoogleIcon className="w-5 h-5" />
              <span className="font-bold text-slate-600 text-sm">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 bg-white border-2 border-mint-100 rounded-xl py-3 shadow-sm active:scale-95 transition-transform">
              <Smartphone className="w-5 h-5 text-mint-600" />
              <span className="font-bold text-slate-600 text-sm">OTP</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="py-6 flex flex-col items-center justify-center opacity-80"
      >
        <LionLogo className="w-8 h-8 opacity-70 mb-1" />
        <span className="text-xs font-bold text-mint-700 tracking-widest uppercase">Made in India</span>
      </motion.div>

    </motion.div>
  );
};

export default App;