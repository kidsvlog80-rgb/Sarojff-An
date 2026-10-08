import React from 'react';

interface CyberGridProps {
  mode?: 'partial' | 'full';
}

export default function CyberGrid({ mode = 'full' }: CyberGridProps) {
  if (mode === 'partial') {
    // For Welcome and AccessKey screens: Top animated cyber grid (60% height) with smooth fade to solid black at bottom
    return (
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#02020a] pointer-events-none w-full h-full gpu-layer" style={{ contain: 'strict' }}>
        <div className="bg-animation absolute top-0 left-0 w-full h-[60%] overflow-hidden">
          <div className="grid-overlay"></div>
        </div>
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[85%] h-[30%] bg-gradient-to-t from-transparent via-[rgba(0,105,185,0.2)] to-transparent blur-3xl pointer-events-none gpu-layer"></div>
      </div>
    );
  }

  // For Game Selection / Predictor Home Page: Full top-to-bottom matrix grid
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#02020a] pointer-events-none w-full h-full gpu-layer" style={{ contain: 'strict' }}>
      <div className="w-full h-full absolute inset-0 overflow-hidden">
        <div className="grid-overlay-full"></div>
      </div>
      {/* Glowing cyberpunk ambient lights */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[90%] h-[40%] bg-gradient-to-t from-transparent via-[rgba(0,140,255,0.16)] to-transparent blur-3xl pointer-events-none gpu-layer"></div>
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[90%] h-[40%] bg-gradient-to-t from-transparent via-[rgba(0,105,255,0.14)] to-transparent blur-3xl pointer-events-none gpu-layer"></div>
    </div>
  );
}
