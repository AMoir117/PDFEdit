'use client';

import { useEffect, useRef } from 'react';

interface PDFViewLayerProps {
  width: number;
  height: number;
  scale: number;
  isActive: boolean;
  onScaleChange: (newScale: number) => void;
}

export default function PDFViewLayer({ width, height, scale, isActive, onScaleChange }: PDFViewLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isActive) return;
      
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.1, Math.min(5, scale + delta));
      onScaleChange(newScale);
    };

    const container = containerRef.current;
    if (container && isActive) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isActive, scale, onScaleChange]);

  return (
    <div 
      ref={containerRef}
      className={`absolute top-0 left-0 z-10 ${isActive ? '' : 'pointer-events-none'}`}
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`
      }}
    />
  );
} 