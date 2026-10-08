import { motion, AnimatePresence } from 'motion/react';

interface LoaderOverlayProps {
  isVisible: boolean;
  statusText?: string;
  customMessages?: string[];
  themeColor?: string;
  gameTitle?: string;
  gameLogo?: string;
  mode?: 'entering' | 'exiting' | 'verifying';
  duration?: number;
}

export default function LoaderOverlay({ 
  isVisible, 
  statusText = 'SYNCING SERVER', 
  themeColor = '#22c55e',
}: LoaderOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl select-none px-6 font-iceland"
          style={{ willChange: 'opacity, backdrop-filter' }}
        >
          {/* Subtle Ambient Center Glow */}
          <div 
            className="absolute w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20"
            style={{ backgroundColor: themeColor || '#38bdf8' }}
          />

          {/* Floating Syncing Server Loader (No Box Style) */}
          <motion.div
            initial={{ scale: 0.92, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 6, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex flex-col items-center justify-center p-4 max-w-xs w-full pointer-events-none"
          >
            {/* Diffuse warm glowing halo behind the dots */}
            <div className="absolute top-1 w-32 h-16 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />

            {/* Glowing Multi-Color Animated Dots (2 Dots) */}
            <div className="relative z-10 flex items-center justify-center gap-3 mb-3">
              {/* Dot 1: Glowing Yellow / Amber */}
              <motion.span
                animate={{
                  y: [-4, 4, -4],
                  scale: [1, 1.22, 1],
                  opacity: [0.85, 1, 0.85]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0
                }}
                className="w-3.5 h-3.5 rounded-full bg-[#facc15] shadow-[0_0_14px_#facc15,0_0_26px_rgba(250,204,21,0.65)]"
              />

              {/* Dot 2: Glowing Red / Coral */}
              <motion.span
                animate={{
                  y: [4, -4, 4],
                  scale: [1.22, 1, 1.22],
                  opacity: [1, 0.85, 1]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.1
                }}
                className="w-3.5 h-3.5 rounded-full bg-[#ef4444] shadow-[0_0_14px_#ef4444,0_0_26px_rgba(239,68,68,0.65)]"
              />
            </div>

            {/* Syncing Server Text */}
            <h3 className="relative z-10 text-[18px] sm:text-[21px] font-extrabold tracking-[0.25em] text-white/95 uppercase text-center leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              {statusText || 'SYNCING SERVER'}
            </h3>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

