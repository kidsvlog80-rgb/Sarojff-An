import React, { useEffect, useRef, memo } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface RecommendationStickerProps {
  className?: string;
  onClick?: () => void;
}

// Module-level cache so JSON is fetched and parsed only once
let cachedRecommendationData: object | null = null;
let isFetchingRecommendation = false;
const listeners: ((data: object) => void)[] = [];

function fetchRecommendationData(callback: (data: object) => void) {
  if (cachedRecommendationData) {
    callback(cachedRecommendationData);
    return;
  }

  listeners.push(callback);
  if (isFetchingRecommendation) return;

  isFetchingRecommendation = true;
  fetch('https://raw.githubusercontent.com/predictorapikeyok-ctrl/Satis-/main/828812893.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      cachedRecommendationData = data;
      isFetchingRecommendation = false;
      while (listeners.length) {
        const cb = listeners.shift();
        if (cb) cb(data);
      }
    })
    .catch(err => {
      console.warn('[RecommendationSticker] GitHub fetch fallback:', err);
      fetch('/ready-ball.json')
        .then(res => res.json())
        .then(data => {
          cachedRecommendationData = data;
          isFetchingRecommendation = false;
          while (listeners.length) {
            const cb = listeners.shift();
            if (cb) cb(data);
          }
        })
        .catch(() => {
          isFetchingRecommendation = false;
        });
    });
}

function RecommendationStickerComponent({
  className = "w-28 h-28 sm:w-32 sm:h-32",
  onClick
}: RecommendationStickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: AnimationItem | null = null;
    let isMounted = true;

    fetchRecommendationData(data => {
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
        console.error('[RecommendationSticker] Canvas render error, trying svg:', err);
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
          console.error('[RecommendationSticker] SVG fallback failed:', svgErr);
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
      {/* Background glowing aura */}
      <div className="absolute inset-1 bg-emerald-500/10 rounded-full blur-xl transform scale-90 pointer-events-none" />

      {/* Lottie Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative z-10 flex items-center justify-center pointer-events-none gpu-layer"
        style={{ width: '100%', height: '100%', minWidth: '90px', minHeight: '90px', transform: 'translate3d(0, 0, 0)', willChange: 'transform', backfaceVisibility: 'hidden' }}
      />
    </div>
  );
}

const RecommendationSticker = memo(RecommendationStickerComponent);
export default RecommendationSticker;

