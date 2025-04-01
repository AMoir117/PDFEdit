'use client';

import { useEffect, useRef, useState } from 'react';
import type { DrawingStroke } from '@/types/pdf';
import { setupCanvasContext, drawStroke, getMousePosition, isWithinCanvas } from '@/utils/canvas';
import { saveDrawingAsPng, redrawStrokes } from '@/utils/pdf';

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
  onDrawingsChange: (drawings: string[]) => void;
  initialDrawings?: string[];
}

export default function PDFDrawingLayer({ width, height, scale, isActive, onScaleChange, onRegisterCanvas, pageNumber, onDrawingsChange, initialDrawings = [] }: PDFDrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [opacity, setOpacity] = useState(1.0);
  const [strokesByPage, setStrokesByPage] = useState<Record<number, DrawingStroke[]>>({});
  const currentStroke = useRef<DrawingStroke>({ points: [], color: '', lineWidth: 0, opacity: 1.0 });
  const [redrawTrigger, setRedrawTrigger] = useState(0);
  const prevPageNumberRef = useRef<number>(pageNumber);
  const [localDrawings, setLocalDrawings] = useState<string[]>(initialDrawings);

  const registerStroke = () => {
    if (currentStroke.current.points.length > 0) {
      setStrokesByPage(prev => ({
        ...prev,
        [pageNumber]: [...(prev[pageNumber] || []), { ...currentStroke.current }]
      }));
    }
  };

  // Handle undo with Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        
        setStrokesByPage(prev => {
          const currentStrokes = prev[pageNumber] || [];
          if (currentStrokes.length === 0) return prev;
          
          const newStrokes = {
            ...prev,
            [pageNumber]: currentStrokes.slice(0, -1)
          };
          
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, width * scale, height * scale);
            redrawStrokes(ctx, newStrokes[pageNumber] || [], scale, lineWidth);
            saveDrawingAsPng(canvasRef.current, pageNumber, localDrawings, setLocalDrawings);
          }
          
          return newStrokes;
        });
      }
    };

    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, pageNumber, ctx, width, height, scale, lineWidth, localDrawings]);

  // Initialize localDrawings from initialDrawings
  useEffect(() => {
    if (initialDrawings.length > 0) {
      const isDifferent = initialDrawings.some((drawing, index) => {
        return drawing !== localDrawings[index];
      });
      
      if (isDifferent) {
        setLocalDrawings(initialDrawings);
      }
    }
  }, [initialDrawings]);

  // Setup canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = setupCanvasContext(canvas, scale, width, height);
    if (context) {
      setCtx(context);
    }
  }, [width, height, scale]);

  // Sync local drawings with parent
  useEffect(() => {
    if (onDrawingsChange && localDrawings.length > 0) {
      const isDifferent = !initialDrawings.length || localDrawings.some((drawing, index) => {
        return drawing !== initialDrawings[index];
      });
      
      if (isDifferent) {
        onDrawingsChange(localDrawings);
      }
    }
  }, [localDrawings]);

  // Save current drawing before changing page
  useEffect(() => {
    if (prevPageNumberRef.current !== pageNumber && ctx && canvasRef.current) {
      saveDrawingAsPng(canvasRef.current, prevPageNumberRef.current, localDrawings, setLocalDrawings);
      ctx.clearRect(0, 0, width * scale, height * scale);
      prevPageNumberRef.current = pageNumber;
    }
  }, [pageNumber, ctx, width, height, scale]);

  // Restore drawing when page changes
  useEffect(() => {
    if (!ctx) return;
    
    if (localDrawings[pageNumber - 1]) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width * scale, height * scale);
        ctx.drawImage(img, 0, 0, width * scale, height * scale);
      };
      img.src = localDrawings[pageNumber - 1];
    } else {
      ctx.clearRect(0, 0, width * scale, height * scale);
    }
  }, [pageNumber, ctx, localDrawings, width, height, scale]);

  // Redraw strokes on scale change
  useEffect(() => {
    if (!ctx) return;
    redrawStrokes(ctx, strokesByPage[pageNumber] || [], scale, lineWidth);
  }, [scale, ctx, width, height, redrawTrigger, pageNumber, strokesByPage, lineWidth]);

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

  // Register canvas with parent
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
    if (!isActive || !ctx || !canvasRef.current) return;
    
    const position = getMousePosition(e, canvasRef.current, scale);
    currentStroke.current = {
      points: [position],
      color,
      lineWidth,
      opacity
    };
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isActive || !ctx || !canvasRef.current) return;
    
    const position = getMousePosition(e, canvasRef.current, scale);
    currentStroke.current.points.push(position);
    drawStroke(ctx, currentStroke.current, scale, lineWidth);
  };

  useEffect(() => {
    if (!isActive || !ctx) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !canvasRef.current) return;

      const position = getMousePosition(e, canvasRef.current, scale);
      if (!isWithinCanvas(position, width, height)) return;
      
      currentStroke.current.points.push(position);
      drawStroke(ctx, currentStroke.current, scale, lineWidth);
    };
    
    const handleGlobalMouseUp = () => {
      if (isDrawing && currentStroke.current.points.length > 1) {
        registerStroke();
        saveDrawingAsPng(canvasRef.current, pageNumber, localDrawings, setLocalDrawings);
      }
      setIsDrawing(false);
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isActive, isDrawing, ctx, scale, width, height, color, lineWidth, registerStroke]);

  return (
    <div className="absolute top-0 left-0 z-40" 
         style={{ 
           pointerEvents: isActive ? 'auto' : 'none',
           position: 'absolute',
           top: 0,
           left: 0,
           width: '100%',
           height: '100%'
         }}>
      {isActive && (
        
        <div className="absolute top-[-83px] left-0 right-0 flex justify-center">
          <div className="flex flex-col items-center w-full max-w-[1200px]">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm py-1 px-4 rounded-t shadow-md w-full select-none">
              <p className="text-center">Scroll to zoom in/out. Left Click to draw.</p>
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-b shadow z-50 border border-gray-300 w-full items-center">
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-black whitespace-nowrap">Size:</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-16"
                />
                <span className="text-xs font-medium text-black min-w-[18px] text-center">{lineWidth}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-black whitespace-nowrap">Opacity:</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-16"
                />
                <span className="text-xs font-medium text-black min-w-[30px] text-center">{Math.round(opacity * 100)}%</span>
              </div>
              
              <div className="border-l border-gray-300 h-6 mx-1"></div>
              
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-black whitespace-nowrap">Color:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6"
                />
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex items-center gap-1">
                {[
                  '#000000', '#FF0000', '#00FF00', '#FFFF00',
                ].map((clr) => (
                  <button
                    key={clr}
                    onClick={() => setColor(clr)}
                    className={`w-5 h-5 rounded-full border ${color === clr ? 'ring-1 ring-offset-1 ring-blue-500' : 'border-gray-300 shadow-sm'}`}
                    style={{ backgroundColor: clr }}
                    title={`Set color to ${clr}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`${isActive ? 'cursor-crosshair' : 'pointer-events-none'}`}
        style={{
          width: `${width * scale}px`,
          height: `${height * scale}px`,
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: isActive ? 'auto' : 'none',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={() => {
          if (currentStroke.current.points.length > 1) {
            registerStroke();
            saveDrawingAsPng(canvasRef.current, pageNumber, localDrawings, setLocalDrawings);
          }
          setIsDrawing(false);
        }}
      />
    </div>
  );
} 