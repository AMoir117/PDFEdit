'use client';

import { useEffect, useRef, useState } from 'react';

export interface PDFDrawingLayerRef {
  getPageDrawing: (pageNumber: number) => HTMLCanvasElement;
}

interface PDFDrawingLayerProps {
  width: number;
  height: number;
  scale: number;
  isActive: boolean;
  onScaleChange: (scale: number) => void;
  onRegisterCanvas: (canvas: HTMLCanvasElement | null) => void;
  pageNumber: number;
}

interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

export default function PDFDrawingLayer({ width, height, scale, isActive, onScaleChange, onRegisterCanvas, pageNumber }: PDFDrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [strokesByPage, setStrokesByPage] = useState<Record<number, DrawingStroke[]>>({});
  const currentStroke = useRef<DrawingStroke>({ points: [], color: '', lineWidth: 0 });

  const [redrawKey, setRedrawKey] = useState(0);
  const [redrawTrigger, setRedrawTrigger] = useState(0);

  // Replace the strokes state with a computed value
  const strokes = strokesByPage[pageNumber] || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scale canvas to match PDF size
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
      setCtx(context);
    }
  }, [width, height, scale]);

  // Redraw all strokes when scale changes or when triggered
  useEffect(() => {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width * scale, height * scale);
    ctx.save();
    ctx.scale(scale, scale);

    // Use the strokes for the current page
    const currentPageStrokes = strokesByPage[pageNumber] || [];
    currentPageStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      stroke.points.forEach((point, i) => {
        if (i > 0) ctx.lineTo(point.x, point.y);
      });
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    });

    ctx.restore();
  }, [scale, ctx, width, height, redrawTrigger, pageNumber, strokesByPage]);

  // Handle zoom with scroll wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isActive) return;
      
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.1, Math.min(5, scale + delta));
      onScaleChange(newScale);
    };

    const canvas = canvasRef.current;
    if (canvas && isActive) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isActive, scale, onScaleChange]);

  // Handle undo with Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        setStrokesByPage(prev => ({
          ...prev,
          [pageNumber]: (prev[pageNumber] || []).slice(0, -1)
        }));
        setRedrawTrigger(prev => prev + 1);
      }
    };

    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, pageNumber]);

  // Register the canvas with parent component
  useEffect(() => {
    if (onRegisterCanvas) {
      onRegisterCanvas(canvasRef.current);
    }
    return () => {
      if (onRegisterCanvas) {
        onRegisterCanvas(null);
      }
    };
  }, [onRegisterCanvas]);

  const startDrawing = (e: React.MouseEvent) => {
    if (!isActive || !ctx) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    currentStroke.current = {
      points: [{ x, y }],
      color,
      lineWidth
    };
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isActive || !ctx) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    currentStroke.current.points.push({ x, y });
    
    // Scale context for the current stroke
    ctx.save();
    ctx.scale(scale, scale);
    
    // Draw the current stroke
    ctx.beginPath();
    ctx.moveTo(currentStroke.current.points[currentStroke.current.points.length - 2].x, 
               currentStroke.current.points[currentStroke.current.points.length - 2].y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Restore context
    ctx.restore();
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.current.points.length > 0) {
      setStrokesByPage(prev => ({
        ...prev,
        [pageNumber]: [...(prev[pageNumber] || []), { ...currentStroke.current }]
      }));
    }
    setIsDrawing(false);
  };

  return (
    <div className="absolute top-0 left-0 z-10">
      {isActive && (
        <div className="absolute top-4 left-4 flex gap-2 bg-white p-2 rounded shadow">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24"
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`${isActive ? 'cursor-crosshair' : 'pointer-events-none'}`}
        style={{
          width: `${width * scale}px`,
          height: `${height * scale}px`,
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
} 