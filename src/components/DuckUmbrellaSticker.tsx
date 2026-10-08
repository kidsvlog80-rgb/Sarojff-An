import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface DuckUmbrellaStickerProps {
  className?: string;
}

export default function DuckUmbrellaSticker({
  className = "w-56 h-56 sm:w-64 sm:h-64"
}: DuckUmbrellaStickerProps) {
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
      // Enable fluid 90 FPS / 120 FPS high refresh subframe rendering
      anim.setSubframe(true);
    };

    // Check if preloaded in window
    const preloaded = (window as unknown as { duckAnimationData?: object }).duckAnimationData;
    if (preloaded) {
      playWithData(preloaded);
    } else {
      fetch('/telegram-duck.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          playWithData(data);
        })
        .catch(err => {
          console.warn('[UmbrellaSticker] Sticker animation notice:', err);
        });
    }

    return () => {
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  return (
    <div className={`relative mx-auto flex items-center justify-center select-none my-2 ${className}`}>
      {/* Ambient glow */}
      <div className="absolute inset-2 bg-cyan-500/20 rounded-full blur-2xl transform scale-90 pointer-events-none" />

      {/* Direct Telegram Duck Lottie Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10 flex items-center justify-center pointer-events-none gpu-layer"
        style={{ width: '100%', height: '100%', transform: 'translate3d(0, 0, 0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
      />
    </div>
  );
}
