import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { playPremiumPortalClickSound } from '../lib/audio';
import { getPublicSettings, subscribePublicSettings } from '../lib/settings';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [telegramUrl, setTelegramUrl] = useState(() => getPublicSettings().telegramUrl);

  useEffect(() => {
    return subscribePublicSettings((settings) => {
      if (settings.telegramUrl) setTelegramUrl(settings.telegramUrl);
    });
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center px-4 py-4 md:py-8 z-10 font-iceland">
      {/* Upper Space Header */}
      <div className="w-full max-w-md text-center pt-2 sm:pt-4 opacity-40">
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-xl w-full my-auto z-10">
        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-0 mt-0 flex items-center justify-center"
        >
          {/* Logo Frame - enlarged as requested */}
          <div className="relative w-[340px] h-[340px] min-[375px]:w-[370px] min-[375px]:h-[370px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] p-1 flex items-center justify-center">
            <img
              src="https://i.ibb.co/KcgyD6L6/Logo-Transparent-D01-HBKjp.png"
              alt="Drago Predictor Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // If the user's specific Image fails to load, gracefully fallback to a high-end cyber dragon SVG icon
                const img = e.currentTarget;
                img.style.display = 'none';
                const parent = img.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'text-cyan-400 text-6xl font-bold flex flex-col items-center justify-center';
                  fallback.innerHTML = `
                    <svg viewBox="0 0 24 24" width="140" height="140" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    <span class="text-xs uppercase tracking-[0.2em] mt-2 text-cyan-200">DRAGO 4.0</span>
                  `;
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </motion.div>

        {/* Text Area - Lifted up closer to logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center px-4 -mt-4 md:-mt-8"
        >
          {/* Welcome Title with dynamic inline coloring */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white tracking-widest font-iceland font-bold uppercase mb-2">
            Welcome to <span className="text-cyan-400 neon-glow-cyan">Drago 4.0</span> <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">Turbo</span>
          </h1>
        </motion.div>

        {/* Buttons Section - Sleek, wider left-to-right & slimmer vertical profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-[500px] flex flex-col gap-2.5 px-2 sm:px-4 md:px-6 mt-3"
        >
          {/* Subtitle positioned directly above the button with premium Iceland font and compact size */}
          <p className="text-center text-xs sm:text-sm font-iceland tracking-[0.2em] text-[#93c5fd] uppercase select-none mb-0.5">
            Click below to start the <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">predictor!</span>
          </p>

          {/* Button 1: Solid Vibrant Royal Blue Pill "Let's Start" Button */}
          <button
            onClick={() => {
              playPremiumPortalClickSound();
              onStart();
            }}
            id="btn-lets-start"
            className="w-full py-2.5 sm:py-3 px-6 rounded-full bg-[#2f7bf6] hover:bg-[#256ee6] active:scale-[0.98] transition-all duration-200 shadow-none flex items-center justify-center cursor-pointer select-none"
          >
            <span className="text-white text-2xl sm:text-3xl font-bold tracking-widest font-iceland uppercase">
              Let's Start
            </span>
          </button>

          {/* Button 2: Outlined Dark Cyan/Blue Pill "Join Telegram" Button */}
          <a
            href={telegramUrl || "https://t.me/+iLrgv9u-WbBlMTM9"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playPremiumPortalClickSound()}
            id="btn-join-telegram"
            className="w-full py-2 sm:py-2.5 px-6 rounded-full border-2 border-[#164e9a] hover:border-[#2f7bf6] bg-[#030919]/80 hover:bg-[#061433]/80 active:scale-[0.98] transition-all duration-200 flex items-center justify-center cursor-pointer select-none block text-center"
          >
            <span className="text-[#38bdf8] hover:text-[#60a5fa] text-2xl sm:text-3xl font-bold tracking-widest font-iceland uppercase transition-colors">
              Join Telegram
            </span>
          </a>
        </motion.div>
      </div>

      {/* Footer Branding Area */}
      <div className="w-full max-w-md flex items-center justify-center pt-8 px-4 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-500/60">
          DRAGO 4.0 TURBO
        </span>
      </div>
    </div>
  );
}
