import React, { useEffect, useRef, memo } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface MuscleDogStickerProps {
  className?: string;
  onClick?: () => void;
}

let cachedDogData: object | null = null;
let isFetchingDog = false;
const dogListeners: ((data: object) => void)[] = [];

function fetchDogData(callback: (data: object) => void) {
  if (cachedDogData) {
    callback(cachedDogData);
    return;
  }

  dogListeners.push(callback);
  if (isFetchingDog) return;

  isFetchingDog = true;
  fetch('https://raw.githubusercontent.com/predictorapikeyok-ctrl/Satis-/main/265268959.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      cachedDogData = data;
      isFetchingDog = false;
      while (dogListeners.length) {
        const cb = dogListeners.shift();
        if (cb) cb(data);
      }
    })
    .catch(err => {
      console.warn('[MuscleDogSticker] GitHub fetch error, loading local copy:', err);
      fetch('/game-sticker.json')
        .then(res => res.json())
        .then(data => {
          cachedDogData = data;
          isFetchingDog = false;
          while (dogListeners.length) {
            const cb = dogListeners.shift();
            if (cb) cb(data);
          }
        })
        .catch(() => {
          isFetchingDog = false;
        });
    });
}

function MuscleDogStickerComponent({
  className = "w-44 h-44 sm:w-52 sm:h-52",
  onClick
}: MuscleDogStickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: AnimationItem | null = null;
    let isMounted = true;

    fetchDogData(data => {
      if (!isMounted || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      try {
        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'canvas',
          loop: true,
          autoplay: true,
          animationData: data,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            clearCanvas: true
          }
        });
        anim.setSubframe(true);
      } catch (err) {
        console.error('[MuscleDogSticker] Canvas render error, trying svg:', err);
        try {
          if (containerRef.current) {
            anim = lottie.loadAnimation({
              container: containerRef.current,
              renderer: 'svg',
              loop: true,
              autoplay: true,
              animationData: data,
              rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet',
                progressiveLoad: true,
                hideOnTransparent: true
              }
            });
            anim.setSubframe(true);
          }
        } catch (svgErr) {
          console.error('[MuscleDogSticker] SVG fallback failed:', svgErr);
        }
      }
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
      {/* Background Cyber Amber Glow */}
      <div className="absolute inset-2 bg-amber-500/10 rounded-full blur-2xl transform scale-90 pointer-events-none" />

      {/* Lottie Render Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10 flex items-center justify-center pointer-events-none gpu-layer"
        style={{ width: '100%', height: '100%', minWidth: '120px', minHeight: '120px', transform: 'translate3d(0, 0, 0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
      />
    </div>
  );
}

const MuscleDogSticker = memo(MuscleDogStickerComponent);
export default MuscleDogSticker;

