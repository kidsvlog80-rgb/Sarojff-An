import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface WinCelebrationStickerProps {
  className?: string;
  onClick?: () => void;
}

export default function WinCelebrationSticker({
  className = "w-72 h-72 sm:w-88 sm:h-88",
  onClick
}: WinCelebrationStickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let anim: AnimationItem | null = null;
    let isMounted = true;

    const startAnimation = (animationJson: object) => {
      if (!containerRef.current || !isMounted) return;
      containerRef.current.innerHTML = '';
      try {
        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animationJson,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
            hideOnTransparent: true
          }
        });
        // Enable subframe interpolation for fluid 90 FPS / 120 FPS display
        anim.setSubframe(true);
      } catch (e) {
        console.error('[WinCelebrationSticker] Lottie load error:', e);
        setLoadError(true);
      }
    };

    // Fetch JSON data dynamically from GitHub URL provided by user
    fetch('https://raw.githubusercontent.com/predictorapikeyok-ctrl/Satis-/main/1755250192.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted) startAnimation(data);
      })
      .catch(err => {
        console.warn('[WinCelebrationSticker] GitHub fetch error, using local fallback:', err);
        fetch('/win-sticker.json')
          .then(r => r.json())
          .then(data => {
            if (isMounted) startAnimation(data);
          })
          .catch(() => {
            if (isMounted) setLoadError(true);
          });
      });

    return () => {
      isMounted = false;
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  return (
    <div
      onClick={onClick}
      className={`relative mx-auto flex items-center justify-center select-none ${className}`}
    >
      {/* Background glowing aura */}
      <div className="absolute inset-2 bg-emerald-500/20 rounded-full blur-2xl transform scale-95 pointer-events-none animate-pulse" />

      {/* Lottie Container */}
      <div 
        id="sticker"
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center relative z-10 gpu-layer" 
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
      />

      {loadError && (
        <div className="text-emerald-400 font-iceland text-sm tracking-widest animate-pulse text-center">
          VICTORY CELEBRATION
        </div>
      )}
    </div>
  );
}
