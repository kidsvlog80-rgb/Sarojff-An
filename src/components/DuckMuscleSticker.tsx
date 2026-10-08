import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface DuckMuscleStickerProps {
  className?: string;
  onClick?: () => void;
}

export default function DuckMuscleSticker({
  className = "w-40 h-40 sm:w-48 sm:h-48",
  onClick
}: DuckMuscleStickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let anim: AnimationItem | null = null;

    const playWithData = (animData: object) => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
          hideOnTransparent: true
        }
      });
      // 90 FPS / 120 FPS high refresh subframe rendering
      anim.setSubframe(true);
    };

    // Direct fetch from GitHub Raw JSON URL as requested
    fetch('https://raw.githubusercontent.com/predictorapikeyok-ctrl/Satis-/main/265268959.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        playWithData(data);
      })
      .catch(err => {
        console.warn('[DuckMuscleSticker] GitHub fetch error, loading local copy:', err);
        fetch('/game-sticker.json')
          .then(res => res.json())
          .then(data => playWithData(data))
          .catch(() => {});
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
      {/* Subtle ambient glow */}
      <div className="absolute inset-2 bg-amber-500/10 rounded-full blur-2xl transform scale-90 pointer-events-none" />

      {/* Direct Telegram Dog/Duck Flex Lottie Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10 flex items-center justify-center pointer-events-none gpu-layer"
        style={{ width: '100%', height: '100%', minWidth: '100px', minHeight: '100px', transform: 'translate3d(0, 0, 0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
      />
    </div>
  );
}
