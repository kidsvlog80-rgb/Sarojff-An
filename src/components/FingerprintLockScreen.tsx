import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, AlertCircle, ShieldAlert } from 'lucide-react';
import { 
  playClickSound, 
  playFingerprintScanning, 
  stopFingerprintScanning, 
  playFingerprintSuccess, 
  playFingerprintDenied 
} from '../lib/audio';

interface FingerprintLockScreenProps {
  onUnlock: () => void;
}

export default function FingerprintLockScreen({ onUnlock }: FingerprintLockScreenProps) {
  const [showModal, setShowModal] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const soundEnabled = true; // Enabled by default to matches client requirements

  // Cleanup scanning animation frame and sound on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      stopFingerprintScanning();
    };
  }, []);

  const handleStartScan = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (showModal) return; // Must dismiss modal first
    if (isUnlocked) return; // Ignore if already unlocked
    
    setIsScanning(true);
    setErrorMessage(null);
    setScanProgress(0);
    
    // Play sci-fi scanning laser loop & clicks
    playFingerprintScanning(soundEnabled);

    // Increment scan progress over ~2 seconds with 90 FPS / 120 FPS requestAnimationFrame
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const updateFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setScanProgress(progress);

      if (progress < 100) {
        animFrameRef.current = requestAnimationFrame(updateFrame);
      } else {
        animFrameRef.current = null;
        handleScanSuccess();
      }
    };

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(updateFrame);
  };

  const handleEndScan = () => {
    if (!isScanning) return;
    
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsScanning(false);
    stopFingerprintScanning();

    if (scanProgress < 100) {
      // Incomplete scan: trigger error state
      playFingerprintDenied(soundEnabled);
      setErrorMessage("HOLD FINGERPRINT");
      setScanProgress(0);
    }
  };

  const handleScanSuccess = () => {
    setIsScanning(false);
    stopFingerprintScanning();
    playFingerprintSuccess(soundEnabled);
    setIsUnlocked(true);
    
    // Allow the 3D double doors to swing wide open from the center (0.9s duration), then finalize unlock
    setTimeout(() => {
      onUnlock();
    }, 950);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden font-iceland select-none pointer-events-auto">
      
      {/* 3D DOUBLE VAULT DOORS THAT SWING OPEN FROM THE CENTER MATCHING drago4.reveo.site */}
      {/* LEFT DOOR */}
      <div 
        className="fixed top-0 bottom-0 left-0 w-[50.2vw] h-full bg-black z-10 overflow-visible pointer-events-none"
        style={{
          transformOrigin: '0% 50%',
          transform: isUnlocked ? 'perspective(1400px) rotateY(-105deg)' : 'perspective(1400px) rotateY(0deg)',
          transition: 'transform 0.9s cubic-bezier(0.65, 0, 0.2, 1)',
          willChange: 'transform'
        }}
      >
        {/* Glowing seam edge on right side of left door */}
        <div className="absolute top-0 bottom-0 right-0 w-[120px] bg-gradient-to-l from-[#0050b4]/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-[#00c8ff] shadow-[0_0_15px_#00c8ff,0_0_30px_#0099ff]" />
      </div>

      {/* RIGHT DOOR */}
      <div 
        className="fixed top-0 bottom-0 right-0 w-[50.2vw] h-full bg-black z-10 overflow-visible pointer-events-none"
        style={{
          transformOrigin: '100% 50%',
          transform: isUnlocked ? 'perspective(1400px) rotateY(105deg)' : 'perspective(1400px) rotateY(0deg)',
          transition: 'transform 0.9s cubic-bezier(0.65, 0, 0.2, 1)',
          willChange: 'transform'
        }}
      >
        {/* Glowing seam edge on left side of right door */}
        <div className="absolute top-0 bottom-0 left-0 w-[120px] bg-gradient-to-r from-[#0050b4]/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-[#00c8ff] shadow-[0_0_15px_#00c8ff,0_0_30px_#0099ff]" />
      </div>

      {/* Main interactive biometric scanning module - fades out gracefully as doors open from middle */}
      <div className={`relative z-30 flex flex-col items-center justify-center p-6 w-full max-w-md transition-all duration-300 ${isUnlocked ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        
        {/* Holographic Glowing Scanner Circles */}
        <div className="relative flex items-center justify-center w-[300px] h-[300px] min-[375px]:w-[340px] min-[375px]:h-[340px] sm:w-[380px] sm:h-[380px] transition-all duration-300">
          
          {/* Subtle Vertical Blue Guideline cutting through center matching drago4.reveo.site */}
          <div className="absolute top-[-250px] bottom-[-250px] w-[1px] bg-[#00c8ff]/25 pointer-events-none z-0" />

          {/* Concentric Radar Ripple Rings (Sharp, clean circular lines) */}
          <div className="absolute inset-[5.5%] border border-[#00c8ff]/25 rounded-full transition-all duration-300 shadow-none" />
          <div className="absolute inset-[11.1%] border border-[#00c8ff]/35 rounded-full transition-all duration-300 shadow-none" />
          
          {/* Inner Scan border rings */}
          <div className="absolute inset-[16.6%] border border-[#00c8ff]/45 rounded-full flex items-center justify-center overflow-hidden bg-black transition-all duration-300 shadow-none">
            {/* Verified feedback */}
            {scanProgress === 100 && (
              <div className="absolute inset-0 bg-[#00c8ff]/20 pointer-events-none" />
            )}
          </div>

          {/* Interactive Core Fingerprint Button Area (Pure black bg, completely stable position, no scale jump) */}
          <button
            onMouseDown={handleStartScan}
            onMouseUp={handleEndScan}
            onMouseLeave={handleEndScan}
            onTouchStart={handleStartScan}
            onTouchEnd={handleEndScan}
            className={`absolute inset-[22.2%] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none z-10 bg-black border shadow-none ${
              isScanning 
                ? 'border-[#00c8ff]/80' 
                : 'border-[#00c8ff]/40 hover:border-[#00c8ff]'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Perfectly centered fingerprint (Never shifts or jumps up on click) */}
            <div className="relative flex items-center justify-center">
              {/* Base dim muted fingerprint */}
              <Fingerprint className="w-24 h-24 min-[375px]:w-28 min-[375px]:h-28 sm:w-32 sm:h-32 stroke-[1.4] text-[#24354a] transition-all duration-200" />
              
              {/* Electric Cyan/Blue color filling upwards from BOTTOM to TOP across the entire fingerprint including both sides */}
              <Fingerprint 
                className="absolute inset-0 w-24 h-24 min-[375px]:w-28 min-[375px]:h-28 sm:w-32 sm:h-32 stroke-[1.4] text-[#00c8ff] pointer-events-none drop-shadow-none"
                style={{
                  clipPath: `inset(${100 - scanProgress}% 0 0 0)`,
                  transition: 'clip-path 75ms linear'
                }}
              />
            </div>

            {/* Scanning Percentage Progress value (Absolute at bottom, never pushes fingerprint up) */}
            <span 
              className={`absolute bottom-3 min-[375px]:bottom-4 left-1/2 -translate-x-1/2 text-base sm:text-lg font-iceland tracking-widest font-bold text-[#00ffff] drop-shadow-none transition-opacity duration-150 pointer-events-none ${
                isScanning ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {Math.floor(scanProgress)}%
            </span>
          </button>
        </div>

        {/* Fixed height container for labels (h-24) - guarantees zero layout shifts or jump */}
        <div className="w-full h-24 flex items-center justify-center text-center px-4 mt-8">
          {errorMessage ? (
            <p className="text-2xl sm:text-3xl font-extrabold tracking-[0.25em] uppercase text-red-500 select-none font-iceland">
              {errorMessage}
            </p>
          ) : (
            <p className="text-2xl sm:text-3xl font-extrabold tracking-[0.25em] uppercase text-[#00c8ff] select-none font-iceland">
              {isScanning ? 'VERIFYING...' : 'HOLD FINGERPRINT'}
            </p>
          )}
        </div>
      </div>

      {/* Immersive Panel Locked Alert Modal Overlay as shown in Screenshot 1 */}
      <AnimatePresence>
        {showModal && (
          <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            
            {/* Modal Body Card styling with 4 symmetrical chamfered cut corners matching Screenshot 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[340px] sm:max-w-[360px] bg-[#0c1626]/95 border border-[#1e3a5f]/60 pt-10 pb-9 px-7 text-center overflow-hidden z-10 shadow-[0_20px_60px_rgba(0,0,0,0.95)] [clip-path:polygon(32px_0,calc(100%-32px)_0,100%_32px,100%_calc(100%-32px),calc(100%-32px)_100%,32px_100%,0_calc(100%-32px),0_32px)] font-iceland"
            >
              {/* Layered Glowing Cyan Exclamation Circle Icon with Smooth Breathing Pulse Animation */}
              <div className="flex justify-center items-center mb-6">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0284c7]/15 flex items-center justify-center">
                  {/* Mid translucent ring */}
                  <motion.div 
                    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#0284c7]/25 flex items-center justify-center"
                  >
                    {/* Core Solid Cyan/Blue Circle with Smooth Pop & Breathing */}
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: [1, 1.07, 0.98, 1.04, 1],
                        boxShadow: [
                          '0 0 15px rgba(56,189,248,0.4)',
                          '0 0 30px rgba(56,189,248,0.8)',
                          '0 0 15px rgba(56,189,248,0.4)'
                        ]
                      }}
                      transition={{ 
                        scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                        boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                        default: { type: 'spring', damping: 14, stiffness: 260 }
                      }}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-[#38bdf8] to-[#0ea5e9] flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ y: [0, -1.5, 0, 1, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
                          <rect x="10.5" y="3.5" width="3" height="9.5" rx="1.5" />
                          <circle cx="12" cy="17" r="1.8" />
                        </svg>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Title Header with premium signature font */}
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-[0.15em] uppercase mb-3 drop-shadow-[0_0_16px_rgba(56,189,248,0.5)] font-iceland">
                Panel Locked!
              </h2>

              {/* Paragraph Content with premium signature font */}
              <p className="text-slate-200 text-lg sm:text-xl leading-relaxed max-w-[280px] mx-auto mb-7 font-bold tracking-[0.06em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-iceland">
                Hello user, panel is currently locked. Please scan your fingerprint to unlock it
              </p>

              {/* Chamfered Hexagonal "Alright" Confirmation Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound(soundEnabled);
                    setShowModal(false);
                  }}
                  className="px-10 py-2.5 sm:py-3 bg-[#2f7bf6] hover:bg-[#256ee6] active:scale-95 text-white font-extrabold text-lg sm:text-xl tracking-[0.2em] uppercase transition-all shadow-[0_4px_22px_rgba(47,123,246,0.45)] cursor-pointer inline-flex items-center justify-center [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,14px_100%,0_50%)] min-w-[150px] font-iceland"
                >
                  Alright
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
