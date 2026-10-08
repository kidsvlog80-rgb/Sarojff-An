import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { playSynthesizerSound } from '../lib/audio';
import LoaderOverlay from './LoaderOverlay';
import DuckUmbrellaSticker from './DuckUmbrellaSticker';
import { PremiumPlansScreen } from './PremiumPlansScreen';

interface AccessKeyScreenProps {
  onVerifySuccess: () => void;
  onBack: () => void;
}

// Helper to get or generate a unique client device identifier for license key-binding
function getOrCreateDeviceId() {
  try {
    let devId = localStorage.getItem('drago_device_id');
    if (!devId) {
      devId = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
      localStorage.setItem('drago_device_id', devId);
    }
    return devId;
  } catch (e) {
    return 'dev-stub-' + Date.now();
  }
}

// Sparkle Star Icon component for background decoration
function SparkleStar({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

// High-tech 3D Digital Security Lock Graphic
function DigitalLockGraphic() {
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto flex items-center justify-center pointer-events-none select-none my-2">
      {/* Background ambient neon glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/25 rounded-full blur-2xl transform scale-110 animate-pulse" />

      {/* Outer Rotating/Pulse Tech Rings */}
      <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-spin-slow" style={{ animationDuration: '20s' }} />
      <div className="absolute inset-5 rounded-full border border-dashed border-blue-400/40 animate-spin-slow" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />

      {/* Floating Sparkles */}
      <div className="absolute top-1 left-2 text-cyan-300 animate-bounce" style={{ animationDuration: '3s' }}>
        <SparkleStar size={16} />
      </div>
      <div className="absolute top-12 right-1 text-cyan-300/80 animate-pulse" style={{ animationDuration: '2s' }}>
        <SparkleStar size={18} />
      </div>
      <div className="absolute bottom-4 left-4 text-cyan-400/70 animate-bounce" style={{ animationDuration: '3.5s' }}>
        <SparkleStar size={14} />
      </div>

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_25px_rgba(0,195,255,0.6)]">
        <defs>
          {/* Gradients */}
          <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="50%" stopColor="#0066ff" />
            <stop offset="100%" stopColor="#001d66" />
          </linearGradient>

          <linearGradient id="lockBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a2540" />
            <stop offset="40%" stopColor="#00152b" />
            <stop offset="100%" stopColor="#020b18" />
          </linearGradient>

          <linearGradient id="lockBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#0077ff" />
            <stop offset="100%" stopColor="#0033aa" />
          </linearGradient>

          <radialGradient id="keyholeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
            <stop offset="60%" stopColor="#0088ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0033aa" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Shield Cyber Hex/Circle Background */}
        <path
          d="M 100 15 L 165 48 L 165 125 C 165 160 100 188 100 188 C 100 188 35 160 35 125 L 35 48 Z"
          fill="none"
          stroke="url(#lockBorderGrad)"
          strokeWidth="2.5"
          opacity="0.6"
          strokeDasharray="6 4"
        />

        {/* Lock Shackle (U-Bar) */}
        <path
          d="M 68 85 L 68 60 C 68 38 132 38 132 60 L 132 85"
          fill="none"
          stroke="url(#shackleGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Shackle inner highlight */}
        <path
          d="M 72 82 L 72 60 C 72 44 128 44 128 60 L 128 82"
          fill="none"
          stroke="#00ffff"
          strokeWidth="2.5"
          opacity="0.8"
          strokeLinecap="round"
        />

        {/* Main Lock Body */}
        <rect
          x="52"
          y="78"
          width="96"
          height="84"
          rx="18"
          fill="url(#lockBodyGrad)"
          stroke="url(#lockBorderGrad)"
          strokeWidth="3.5"
        />

        {/* Top Metallic Bevel Edge on Lock */}
        <path
          d="M 62 82 H 138"
          stroke="#00e1ff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Tech Circuit Line Accents on Lock Body */}
        <path d="M 62 100 H 75 L 82 107" fill="none" stroke="#00a2ff" strokeWidth="1.5" opacity="0.6" />
        <circle cx="82" cy="107" r="2" fill="#00ffff" />

        <path d="M 138 100 H 125 L 118 107" fill="none" stroke="#00a2ff" strokeWidth="1.5" opacity="0.6" />
        <circle cx="118" cy="107" r="2" fill="#00ffff" />

        {/* Center Glowing Keyhole Container */}
        <circle cx="100" cy="120" r="22" fill="url(#keyholeGlow)" opacity="0.3" />
        <circle cx="100" cy="120" r="16" fill="#020c1b" stroke="#00d2ff" strokeWidth="2" />

        {/* Keyhole Silhouette */}
        <circle cx="100" cy="115" r="5.5" fill="#00ffff" />
        <polygon points="96.5,117 103.5,117 105,128 95,128" fill="#00ffff" />

        {/* Glowing Status Dot */}
        <circle cx="100" cy="148" r="3" fill="#00ffcc" className="animate-pulse" />
      </svg>
    </div>
  );
}

export default function AccessKeyScreen({ onVerifySuccess, onBack }: AccessKeyScreenProps) {
  const [accessKey, setAccessKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('drago_active_key_info');
      if (saved) {
        const info = JSON.parse(saved);
        if (Date.now() < info.expiresAt) {
          return info.keyName || '';
        }
      }
    } catch (e) {}
    return '';
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    if (localStorage.getItem('drago_key_expired_alert') === 'true') {
      localStorage.removeItem('drago_key_expired_alert');
      return 'ATTENTION PORTAL EXPIRY:\n\nYour previous access key has expired.\nPlease buy or enter a new activation key.';
    }
    return null;
  });
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showPremiumPlans, setShowPremiumPlans] = useState<boolean>(false);
  const [showAccessGrantedModal, setShowAccessGrantedModal] = useState<boolean>(false);
  const [verifiedKeyInfo, setVerifiedKeyInfo] = useState<{ keyName?: string; days?: number } | null>(null);

  // If user opened Premium Plans Screen
  if (showPremiumPlans) {
    return <PremiumPlansScreen onBack={() => setShowPremiumPlans(false)} />;
  }

  const handleKeyPress = () => {
    playSynthesizerSound('click');
  };

  const handleBuyKeyRedirect = () => {
    playSynthesizerSound('click');
  };

  const handleAccessGrantedConfirm = () => {
    playSynthesizerSound('click');
    setShowAccessGrantedModal(false);
    onVerifySuccess();
  };

interface StoredAdminKey {
  id: string;
  type: 'access' | 'server';
  key: string;
  days: number;
  created: number;
  expires: number;
  deleted?: boolean;
}

const BUILT_IN_PORTAL_KEYS = [
  'DRAGO-VIP-2026',
  'TURBO-NFU8-57KK-8V3A',
  'DRAGO-TURBO-99',
  'VIP-TURBO-2026',
  'DRAGO-FREE-TRIAL'
];

function checkLocalOfflineKey(key: string): { valid: boolean; days: number; isTrial: boolean; isExpired?: boolean } {
  const upper = key.trim().toUpperCase().replace(/[\s\r\n\t]/g, '');
  if (BUILT_IN_PORTAL_KEYS.includes(upper)) {
    const isTrial = upper.includes('TRIAL');
    return { valid: true, days: isTrial ? 1 : 9999, isTrial };
  }
  try {
    const raw = localStorage.getItem('drago_keys_v1');
    if (raw) {
      const keys: StoredAdminKey[] = JSON.parse(raw);
      if (Array.isArray(keys)) {
        const found = keys.find((k) => k.type === 'access' && k.key.toUpperCase() === upper);
        if (found) {
          if (found.deleted || (found.expires && Date.now() > found.expires)) {
            return { valid: false, days: 0, isTrial: false, isExpired: true };
          }
          const isTrial = found.days < 1 || found.key.includes('TRIAL') || found.key.includes('2MIN');
          return { valid: true, days: found.days, isTrial };
        }
      }
    }
  } catch (e) {
    // Ignore error
  }
  return { valid: false, days: 0, isTrial: false };
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSynthesizerSound('click');

    const trimmed = accessKey.trim().toUpperCase().replace(/[\s\r\n\t]/g, '');

    if (!trimmed) {
      setErrorMsg('Opps! Please enter your key first.');
      playSynthesizerSound('error');
      return;
    }

    const deviceId = getOrCreateDeviceId();
    setIsVerifying(true);

    const activateLocally = (days: number, isTrial: boolean) => {
      setIsVerifying(false);
      setIsSuccess(true);
      setErrorMsg(null);
      playSynthesizerSound('success');
      const now = Date.now();
      const defaultDuration = isTrial ? 2 * 60 * 1000 : days >= 9999 ? 100 * 365 * 24 * 60 * 60 * 1000 : days * 24 * 60 * 60 * 1000;
      const keyInfo = {
        keyName: trimmed,
        days: days,
        activatedAt: now,
        expiresAt: now + defaultDuration,
        sessionSignature: 'sig-local-auth-' + Math.random().toString(36).substring(2)
      };
      localStorage.setItem('drago_active_key_info', JSON.stringify(keyInfo));
      localStorage.setItem('drago_session_signature', keyInfo.sessionSignature);
      localStorage.removeItem('drago_key_expired_alert');
      setVerifiedKeyInfo({ keyName: keyInfo.keyName, days: isTrial ? 1 : keyInfo.days });
      setShowAccessGrantedModal(true);
    };

    try {
      const fetchPromise = fetch('/api/activate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: trimmed, deviceId })
      });

      const delayPromise = new Promise((resolve) => setTimeout(resolve, 800));
      const [res] = await Promise.all([fetchPromise, delayPromise]);

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        // Static hosting (e.g. edgeone.dev) or non-JSON returned
      }

      if (res.ok && data && data.success) {
        setIsVerifying(false);
        setIsSuccess(true);
        setErrorMsg(null);
        playSynthesizerSound('success');
        
        const now = Date.now();
        const isTrialKey = trimmed.includes('2MIN') || trimmed.includes('TRIAL');
        const defaultDuration = isTrialKey ? 2 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const keyInfo = {
          keyName: data.keyName || trimmed,
          days: data.days || (isTrialKey ? 1 : 30),
          activatedAt: data.activatedAt || now,
          expiresAt: data.expiresAt || (now + defaultDuration),
          sessionSignature: data.sessionSignature || ''
        };
        
        localStorage.setItem('drago_active_key_info', JSON.stringify(keyInfo));
        if (data.sessionSignature) {
          localStorage.setItem('drago_session_signature', data.sessionSignature);
        }
        localStorage.removeItem('drago_key_expired_alert');
        setVerifiedKeyInfo({ keyName: keyInfo.keyName, days: isTrialKey ? 1 : keyInfo.days });
        setShowAccessGrantedModal(true);
        return;
      }

      // If business rejection from real API
      if (!res.ok && data && data.message && res.status !== 404 && !res.status.toString().startsWith('5')) {
        // Check if offline valid key can override
        const offlineCheck = checkLocalOfflineKey(trimmed);
        if (offlineCheck.valid) {
          activateLocally(offlineCheck.days, offlineCheck.isTrial);
          return;
        }

        setIsVerifying(false);
        setIsSuccess(false);
        localStorage.removeItem('drago_active_key_info');
        localStorage.removeItem('drago_server_key_verified');
        localStorage.removeItem('drago_server_key_name');
        localStorage.removeItem('drago_session_signature');
        
        const msg = data.message?.replace(/^Opps!?\s*:?\s*/i, '') || 'The key you entered is invalid or already used!';
        setErrorMsg(msg);
        playSynthesizerSound('error');
        return;
      }

      // If 404 or other server error, check local key list
      const offlineCheck = checkLocalOfflineKey(trimmed);
      if (offlineCheck.valid) {
        activateLocally(offlineCheck.days, offlineCheck.isTrial);
        return;
      }
      if (offlineCheck.isExpired) {
        setIsVerifying(false);
        setIsSuccess(false);
        setErrorMsg('This key has EXPIRED or was deleted from Admin Panel!');
        playSynthesizerSound('error');
        return;
      }

      setIsVerifying(false);
      setIsSuccess(false);
      setErrorMsg('This key is invalid or does not exist. Please check and try again.');
      playSynthesizerSound('error');

    } catch (err) {
      // Offline, network error, or static hosting (like edgeone.dev)
      const offlineCheck = checkLocalOfflineKey(trimmed);
      if (offlineCheck.valid) {
        activateLocally(offlineCheck.days, offlineCheck.isTrial);
        return;
      }
      if (offlineCheck.isExpired) {
        setIsVerifying(false);
        setIsSuccess(false);
        setErrorMsg('This key has EXPIRED or was deleted from Admin Panel!');
        playSynthesizerSound('error');
        return;
      }

      setIsVerifying(false);
      setIsSuccess(false);
      setErrorMsg('This key is invalid or does not exist. Please check and try again.');
      playSynthesizerSound('error');
    }
  };

  return (
    <>
      <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-6 z-10 select-none overflow-hidden font-oxanium">
        
        {/* Main Content Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-[480px] mx-auto flex flex-col items-center text-center z-10 px-2 sm:px-4"
        >

          {/* Animated Duck Umbrella Sticker Graphic - Scaled to perfect balanced size */}
          <div className="w-full flex items-center justify-center pt-2 sm:pt-3">
            <DuckUmbrellaSticker className="w-[215px] h-[215px] min-[390px]:w-[230px] min-[390px]:h-[230px] sm:w-[255px] sm:h-[255px]" />
          </div>

          {/* Title Header - Larger font & tightly spaced lines shifted slightly to the left, clean crisp text without glow */}
          <div className="mt-3 sm:mt-5 mb-2 space-y-0 font-iceland w-full text-left -translate-x-2.5 sm:-translate-x-4 px-0">
            <h1 className="text-[2.6rem] min-[380px]:text-[3rem] sm:text-6xl md:text-7xl font-bold text-white tracking-wide leading-[0.88] whitespace-nowrap">
              Hello <span className="text-[#00c8ff] font-bold">dude!</span>
            </h1>
            <h1 className="text-[2.6rem] min-[380px]:text-[3rem] sm:text-6xl md:text-7xl font-bold text-white tracking-wide leading-[0.88] whitespace-nowrap">
              please enter your
            </h1>
            <h1 className="text-[2.6rem] min-[380px]:text-[3rem] sm:text-6xl md:text-7xl font-bold text-white tracking-wide leading-[0.88] whitespace-nowrap">
              private <span className="text-[#00c8ff] font-bold">Access</span> key
            </h1>
          </div>

          {/* Access Key Form - Shifted a bit lower */}
          <form onSubmit={handleSubmit} className="w-full mt-8 sm:mt-10 pb-4">
            
            {/* Input Field */}
            <div className="relative w-full border-b-2 border-[#0099ff]/80 pb-2 mb-2">
              <input
                type="text"
                value={accessKey}
                onChange={(e) => {
                  setAccessKey(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onFocus={handleKeyPress}
                placeholder="Enter your Access"
                className="w-full bg-transparent text-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-widest text-cyan-200 placeholder-[#477085] focus:outline-none transition-all duration-300 font-iceland uppercase"
              />
            </div>

            {/* Sleek, Wider & Slimmer Pill-Shaped Buttons */}
            <div className="flex flex-col gap-3.5 mt-8 sm:mt-10 w-full">
              
              {/* Submit Button - Clean flat solid blue when active, dimmed when empty, without glow/chamak */}
              <button
                type="submit"
                onClick={handleKeyPress}
                id="btn-submit-key"
                disabled={isVerifying || !accessKey.trim()}
                className={`w-full py-2.5 sm:py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center select-none shadow-none ${
                  accessKey.trim()
                    ? "bg-[#2f7bf6] hover:bg-[#256ee6] active:scale-[0.98] cursor-pointer opacity-100"
                    : "bg-[#182b4a]/50 text-white/30 border border-[#223e66]/40 cursor-not-allowed opacity-40"
                }`}
              >
                <span className={`text-2xl sm:text-3xl font-bold tracking-widest font-iceland uppercase ${
                  accessKey.trim() 
                    ? "text-white" 
                    : "text-[#8ea9cb]/40"
                }`}>
                  Submit
                </span>
              </button>

              {/* Buy Key Button */}
              <button
                type="button"
                onClick={() => {
                  playSynthesizerSound('click');
                  setShowPremiumPlans(true);
                }}
                id="btn-buy-key"
                className="w-full py-2 sm:py-2.5 px-6 rounded-full border-2 border-[#164e9a] hover:border-[#2f7bf6] bg-[#030919]/80 hover:bg-[#061433]/80 active:scale-[0.98] transition-all duration-200 flex items-center justify-center cursor-pointer select-none text-center shadow-[0_4px_16px_rgba(0,166,255,0.15)]"
              >
                <span className="text-[#38bdf8] hover:text-[#60a5fa] text-2xl sm:text-3xl font-bold tracking-widest font-iceland uppercase transition-colors drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                  Buy Key
                </span>
              </button>

            </div>
          </form>

        </motion.div>
      </div>

      <LoaderOverlay isVisible={isVerifying} />

      {/* Access Granted Success Modal */}
      <AnimatePresence>
        {showAccessGrantedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleAccessGrantedConfirm}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-0"
            />

            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 350 }}
              className="relative max-w-[340px] sm:max-w-[370px] w-full bg-[#0b1326]/95 border border-[#1e3a5f]/90 [clip-path:polygon(20px_0,calc(100%-20px)_0,100%_20px,100%_calc(100%-20px),calc(100%-20px)_100%,20px_100%,0_calc(100%-20px),0_20px)] pt-9 pb-8 px-6 text-center overflow-hidden z-10 shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
            >
              {/* Green Animated Glowing Check Badge */}
              <motion.div 
                initial={{ scale: 0, rotate: -25 }}
                animate={{ 
                  scale: [1, 1.06, 0.98, 1.03, 1],
                  rotate: [0, -2, 2, -1, 0],
                  boxShadow: [
                    '0 0 25px rgba(74,222,128,0.45)',
                    '0 0 45px rgba(74,222,128,0.85)',
                    '0 0 25px rgba(74,222,128,0.45)'
                  ]
                }}
                transition={{ 
                  scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                  boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                  default: { type: 'spring', damping: 15, stiffness: 280 }
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-[#4ade80] to-[#16a34a] flex items-center justify-center mx-auto mb-5 cursor-default select-none p-1.5"
              >
                <div className="w-full h-full rounded-full bg-[#86efac]/25 border-2 border-[#bbf7d0]/80 flex items-center justify-center">
                  <motion.svg 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-white fill-none stroke-current drop-shadow-md" 
                    viewBox="0 0 24 24" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                </div>
              </motion.div>

              {/* Title Header */}
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mb-1.5 font-sans">
                Access Granted!
              </h3>

              {/* Subtitle Message */}
              <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed max-w-[270px] mx-auto mb-5 font-sans">
                Key verified successfully!
              </p>

              {/* Active License Tier Pill (if present) */}
              {verifiedKeyInfo?.days && (
                <div className="mb-6 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                  <span>✦ {verifiedKeyInfo.days >= 365 ? 'UNLIMITED LIFETIME' : `${verifiedKeyInfo.days} Days Active`} ✦</span>
                </div>
              )}

              {/* Hexagon Chamfered Okay Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAccessGrantedConfirm}
                  id="btn-access-granted-okay"
                  className="px-12 py-2.5 sm:py-3 bg-[#2f7bf6] hover:bg-[#256ee6] active:scale-95 text-white font-semibold text-base sm:text-lg transition-all shadow-[0_4px_22px_rgba(47,123,246,0.45)] cursor-pointer inline-flex items-center justify-center [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,12px_100%,0_50%)] min-w-[145px]"
                >
                  Okay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Opps! Error Modal */}
      <AnimatePresence>
        {errorMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                playSynthesizerSound('click');
                setErrorMsg(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"
            />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              className="relative max-w-[340px] sm:max-w-[360px] w-full bg-[#0b1220]/95 border border-[#1e293b]/90 [clip-path:polygon(20px_0,calc(100%-20px)_0,100%_20px,100%_calc(100%-20px),calc(100%-20px)_100%,20px_100%,0_calc(100%-20px),0_20px)] pt-9 pb-8 px-6 text-center overflow-hidden z-10 shadow-[0_15px_45px_rgba(0,0,0,0.8)]"
            >
              {/* Yellow Exclamation Circle Icon with Smooth Entry Bounce & Continuous Breathing Animation */}
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ 
                  scale: [1, 1.08, 0.98, 1.04, 1],
                  rotate: [0, -2, 2, -1, 0],
                  boxShadow: [
                    '0 0 20px rgba(251,133,0,0.4)',
                    '0 0 35px rgba(255,183,3,0.75)',
                    '0 0 20px rgba(251,133,0,0.4)'
                  ]
                }}
                transition={{ 
                  scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                  boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                  default: { type: 'spring', damping: 14, stiffness: 260 }
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-[#ffb703] to-[#fb8500] flex items-center justify-center mx-auto mb-5 cursor-default select-none"
              >
                <motion.div
                  animate={{ y: [0, -2, 0, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 text-white fill-current drop-shadow-md" viewBox="0 0 24 24">
                    {/* Exclamation Bar with rounded ends */}
                    <rect x="10.2" y="3.5" width="3.6" height="10.5" rx="1.8" />
                    {/* Exclamation Dot */}
                    <circle cx="12" cy="18" r="2.1" />
                  </svg>
                </motion.div>
              </motion.div>

              {/* Title Header */}
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mb-2 font-sans">
                Opps!
              </h3>

              {/* Error Message Text */}
              <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed max-w-[270px] mx-auto mb-7 font-sans">
                {errorMsg}
              </p>

              {/* Hexagon Chamfered Okay Button */}
              <button
                type="button"
                onClick={() => {
                  playSynthesizerSound('click');
                  setErrorMsg(null);
                }}
                className="px-10 py-2.5 sm:py-3 bg-[#2f7bf6] hover:bg-[#256ee6] active:scale-95 text-white font-semibold text-base sm:text-lg transition-all shadow-[0_4px_18px_rgba(47,123,246,0.35)] cursor-pointer inline-flex items-center justify-center [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,12px_100%,0_50%)] min-w-[135px]"
              >
                Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

