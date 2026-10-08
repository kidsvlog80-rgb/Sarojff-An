import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface MascotStickerProps {
  className?: string;
  onClick?: () => void;
}

export default function MascotSticker({
  className = "w-44 h-44 sm:w-52 sm:h-52",
  onClick
}: MascotStickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let anim: AnimationItem | null = null;

    const startAnimation = (animationJson: object) => {
      if (!containerRef.current) return;
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
        // Enable subframe interpolation for fluid 90 FPS / 120 FPS high refresh rates
        anim.setSubframe(true);
      } catch (e) {
        console.error('[MascotSticker] Animation load failed:', e);
        setLoadError(true);
      }
    };

    // Direct fetch from GitHub Raw JSON URL as requested
    fetch('https://raw.githubusercontent.com/predictorapikeyok-ctrl/Satis-/main/265268959.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error ${r.status}`);
        return r.json();
      })
      .then(data => startAnimation(data))
      .catch(err => {
        console.warn('[MascotSticker] GitHub fetch error, loading local copy:', err);
        fetch('/game-sticker.json')
          .then(r => r.json())
          .then(data => startAnimation(data))
          .catch(() => setLoadError(true));
      });

    return () => {
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
      {/* Subtle ambient cyber glow */}
      <div className="absolute inset-2 bg-yellow-400/10 rounded-full blur-2xl transform scale-90 pointer-events-none" />

      {/* Lottie Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10 flex items-center justify-center pointer-events-none gpu-layer"
        style={{ width: '100%', height: '100%', minWidth: '120px', minHeight: '120px', transform: 'translate3d(0, 0, 0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
      />

      {loadError && (
        <iframe
          src="/duck-muscle-sticker.html"
          title="Sticker Mascot"
          className="w-full h-full border-0 pointer-events-none relative z-10"
        />
      )}
    </div>
  );
}
