import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CyberGrid from './components/CyberGrid';
import WelcomeScreen from './components/WelcomeScreen';
import FingerprintLockScreen from './components/FingerprintLockScreen';
import AccessKeyScreen from './components/AccessKeyScreen';
import PredictorScreen from './components/PredictorScreen';
import AdminPanel from './components/AdminPanel';
import { fetchRemoteSettings } from './lib/settings';

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path.includes('/admin') || path.endsWith('admin') || hash.includes('admin') || search.includes('admin');
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'accessKey' | 'predictor' | 'admin'>(() => {
    return checkIsAdminRoute() ? 'admin' : 'welcome';
  });
  const [isEstimatorLive, setIsEstimatorLive] = useState(false);
  const [activeLiveGame, setActiveLiveGame] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(() => !checkIsAdminRoute());

  useEffect(() => {
    fetchRemoteSettings();

    const handleUrlChange = () => {
      if (checkIsAdminRoute()) {
        setCurrentScreen('admin');
        setIsLocked(false);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // Keyboard shortcut to open admin: Alt + A or Ctrl + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        window.history.pushState(null, '', '/admin');
        setCurrentScreen('admin');
        setIsLocked(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateToAdmin = () => {
    try {
      window.history.pushState(null, '', '/admin');
    } catch (e) {
      // Ignore if iframe sandboxed
    }
    setCurrentScreen('admin');
    setIsLocked(false);
  };

  const navigateFromAdminToApp = () => {
    try {
      window.history.pushState(null, '', '/');
    } catch (e) {
      // Ignore if iframe sandboxed
    }
    setCurrentScreen('welcome');
  };

  const isRedLiveTheme = isEstimatorLive && activeLiveGame === 'eightytwolottery';
  const isJalwaLiveTheme = isEstimatorLive && activeLiveGame === 'jalwagame';
  const isTirangaLiveTheme = isEstimatorLive && activeLiveGame === 'tiranga';
  const isFiftyOneLiveTheme = isEstimatorLive && activeLiveGame === 'fiftyonegame';
  const isJaiClubLiveTheme = isEstimatorLive && activeLiveGame === 'jaiclub';
  const isGoaLiveTheme = isEstimatorLive && activeLiveGame === 'goagame';
  const isNinetyOneLiveTheme = isEstimatorLive && activeLiveGame === 'ninetyoneclub';
  const isBdgLiveTheme = isEstimatorLive && activeLiveGame === 'bdgwin';
  const isSreeWinLiveTheme = isEstimatorLive && activeLiveGame === 'sreewin';
  const isSixClubLiveTheme = isEstimatorLive && activeLiveGame === 'sixclub';
  const isVeerGameLiveTheme = isEstimatorLive && activeLiveGame === 'veergame';
  const isDmFirstLiveTheme = isEstimatorLive && activeLiveGame === 'dmfirst';

  return (
    <div className={`relative min-h-screen ${
      isEstimatorLive 
        ? isRedLiveTheme || isNinetyOneLiveTheme
          ? "bg-gradient-to-b from-[#2c0505] via-[#0c0101] to-black" 
          : isSixClubLiveTheme
            ? "bg-gradient-to-b from-[#2e1d03] via-[#0f0901] to-black"
            : isVeerGameLiveTheme
              ? "bg-gradient-to-b from-[#062810] via-[#021307] to-black"
              : isDmFirstLiveTheme
                ? "bg-gradient-to-b from-[#062419] via-[#02130d] to-black"
                : isBdgLiveTheme
            ? "bg-gradient-to-b from-[#251403] via-[#0b0601] to-black"
            : isSreeWinLiveTheme
              ? "bg-gradient-to-b from-[#1e0734] via-[#0d0219] to-black"
              : isJalwaLiveTheme
            ? "bg-gradient-to-b from-[#061A33] via-[#020A16] to-black"
            : isTirangaLiveTheme
              ? "bg-gradient-to-b from-[#0d162d] via-[#040816] to-black"
              : isFiftyOneLiveTheme
                ? "bg-gradient-to-b from-[#201505] via-[#0a0601] to-black"
                : isJaiClubLiveTheme
                  ? "bg-gradient-to-b from-[#2a053b] via-[#0b0110] to-black"
                  : isGoaLiveTheme
                    ? "bg-gradient-to-b from-[#05112e] via-[#010410] to-black"
                    : "bg-gradient-to-b from-[#07240c] via-[#020c04] to-black" 
        : "bg-[#02020a]"
    } overflow-x-hidden text-white flex flex-col`}>
      {/* Dynamic green/red/navy ambient light overlays across the entire screen when Estimator is Live */}
      {isEstimatorLive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 gpu-layer" style={{ contain: 'paint', willChange: 'opacity' }}>
          {isRedLiveTheme || isNinetyOneLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#ef4444]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#ef4444]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#7f1d1d]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#ef4444]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isJalwaLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#61DACC]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#0d9488]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#0f766e]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#61DACC]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isTirangaLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#6495ED]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#3b82f6]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#1e3a8a]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#6495ED]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isFiftyOneLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#f59e0b]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#d97706]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#78350f]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#f59e0b]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isJaiClubLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#d946ef]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#a855f7]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#581c87]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#d946ef]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isGoaLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#6495ED]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#3b82f6]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#1e3a8a]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#6495ED]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isBdgLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#F0D597]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#d4af37]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#451a03]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#F0D597]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isSreeWinLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#8b5cf6]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#a855f7]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#3b0764]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#8b5cf6]/18 to-transparent pointer-events-none z-0" />
            </>
          ) : isSixClubLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#f59e0b]/40 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#eab308]/30 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#78350f]/50 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#f59e0b]/20 to-transparent pointer-events-none z-0" />
            </>
          ) : isVeerGameLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#22c55e]/40 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#16a34a]/30 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#14532d]/50 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#22c55e]/20 to-transparent pointer-events-none z-0" />
            </>
          ) : isDmFirstLiveTheme ? (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#10b981]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#f59e0b]/30 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#064e3b]/50 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#eab308]/20 to-transparent pointer-events-none z-0" />
            </>
          ) : (
            <>
              <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#21F102]/35 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse gpu-layer" style={{ animationDuration: '5s' }} />
              <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#21F102]/25 blur-[100px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#075000]/45 blur-[110px] pointer-events-none z-0 animate-pulse gpu-layer" style={{ animationDuration: '10s' }} />
              {/* Subtle gradient banner backdrop */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#21F102]/18 to-transparent pointer-events-none z-0" />
            </>
          )}
        </div>
      )}

      {/* Cyber Grid: Partial (Top grid + bottom black) on Welcome/AccessKey screens, and Full grid on Predictor home page */}
      {!isEstimatorLive && (
        <CyberGrid 
          mode={currentScreen === 'welcome' || currentScreen === 'accessKey' ? 'partial' : 'full'} 
        />
      )}

      {/* Screen container with transition animations */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full">
        <AnimatePresence mode="wait">
          {currentScreen === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex-1 flex flex-col w-full"
            >
              <WelcomeScreen 
                onStart={() => {
                  setCurrentScreen('accessKey');
                }} 
              />
            </motion.div>
          )}

          {currentScreen === 'accessKey' && (
            <motion.div
              key="accessKey"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1 flex flex-col w-full items-center justify-center"
            >
              <AccessKeyScreen 
                onVerifySuccess={() => setCurrentScreen('predictor')} 
                onBack={() => setCurrentScreen('welcome')} 
              />
            </motion.div>
          )}

          {currentScreen === 'predictor' && (
            <motion.div
              key="predictor"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex-1 flex flex-col w-full"
            >
              <PredictorScreen 
                onBack={() => {
                  setIsEstimatorLive(false);
                  setActiveLiveGame(null);
                  setCurrentScreen('accessKey');
                }} 
                onServerStateChange={(started, gameId) => {
                  setIsEstimatorLive(started);
                  if (started && gameId) {
                    setActiveLiveGame(gameId);
                  } else if (!started) {
                    setActiveLiveGame(null);
                  }
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1 flex flex-col w-full"
            >
              <AdminPanel onBackToApp={navigateFromAdminToApp} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fingerprint lock screen overlay */}
      <AnimatePresence>
        {isLocked && (
          <FingerprintLockScreen onUnlock={() => setIsLocked(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
