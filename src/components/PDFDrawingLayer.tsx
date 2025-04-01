'use client';

import { useEffect, useRef, useState } from 'react';
import type { DrawingStroke } from '@/types/pdf';

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

  // Store previous pageNumber to detect page changes
  const prevPageNumberRef = useRef<number>(pageNumber);

  // Modified: Initialize with parent's drawings if available
  const [localDrawings, setLocalDrawings] = useState<string[]>(initialDrawings);

  // Replace the strokes state with a computed value

  // Initialize localDrawings from initialDrawings when component mounts or when initialDrawings changes
  useEffect(() => {
    if (initialDrawings.length > 0) {
      // Only update if the content actually changed to prevent loops
      const isDifferent = initialDrawings.some((drawing, index) => {
        return drawing !== localDrawings[index];
      });
      
      if (isDifferent) {
        setLocalDrawings(initialDrawings);
      }
    }
  }, [initialDrawings]);

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

  // NEW EFFECT: Sync local drawings with parent component's drawings
  // Only sync when local drawings have actually changed to avoid loops
  useEffect(() => {
    // Don't call this on every render or when initializing with parent's drawings
    if (onDrawingsChange && localDrawings.length > 0) {
      // Avoid running this effect due to parent updates coming back to child
      const isDifferent = !initialDrawings.length || localDrawings.some((drawing, index) => {
        return drawing !== initialDrawings[index];
      });
      
      if (isDifferent) {
        onDrawingsChange(localDrawings);
      }
    }
  }, [localDrawings]);  // Removed onDrawingsChange dependency to break the cycle

  // Modified: Save current drawing before changing page
  useEffect(() => {
    if (prevPageNumberRef.current !== pageNumber && ctx && canvasRef.current) {
      // Save drawing from the previous page
      saveDrawingAsPng(prevPageNumberRef.current);
      
      // Clear the canvas for the new page
      ctx.clearRect(0, 0, width * scale, height * scale);
      
      // Update the reference
      prevPageNumberRef.current = pageNumber;
    }
  }, [pageNumber, ctx, width, height, scale]);

  // New effect: Restore drawing when page is loaded or changed
  useEffect(() => {
    if (!ctx) return;
    
    // Check if we have a drawing for this page
    if (localDrawings[pageNumber - 1]) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width * scale, height * scale);
        ctx.drawImage(img, 0, 0, width * scale, height * scale);
      };
      img.src = localDrawings[pageNumber - 1];
    } else {
      // Clear the canvas if no drawing exists
      ctx.clearRect(0, 0, width * scale, height * scale);
    }
  }, [pageNumber, ctx, localDrawings, width, height, scale]);

  // Redraw all strokes when scale changes or when triggered
  useEffect(() => {
    if (!ctx) return;
    
    // We now handle the drawing rendering in the restore effect above
    // This is just for redrawing strokes
    
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
      ctx.lineWidth = stroke.lineWidth || lineWidth;
      ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1.0;
      ctx.stroke();
    });

    ctx.restore();
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

  // Function definitions
  const startDrawing = (e: React.MouseEvent) => {
    if (!isActive || !ctx) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    currentStroke.current = {
      points: [{ x, y }],
      color,
      lineWidth,
      opacity
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
    ctx.globalAlpha = opacity;
    ctx.stroke();
    
    // Restore context
    ctx.restore();
  };

  // Function to register strokes for the current page
  const registerStroke = () => {
    if (currentStroke.current.points.length > 0) {
      setStrokesByPage(prev => ({
        ...prev,
        [pageNumber]: [...(prev[pageNumber] || []), { ...currentStroke.current }]
      }));
    }
  };

  // Modified: Save drawings for a specific page
  const saveDrawingAsPng = async (pageNum = pageNumber) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setLocalDrawings(prev => {
        const newDrawings = [...prev];
        // Ensure the array has enough elements
        while (newDrawings.length < pageNum) {
          newDrawings.push('');
        }
        newDrawings[pageNum - 1] = dataUrl; // Store the drawing for the current page
        return newDrawings;
      });
    }
  };

  // Now add global mouse event handlers after function declarations
  useEffect(() => {
    if (!isActive || !ctx) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      
      if (x < 0 || x > width || y < 0 || y > height) return; // Only draw within the canvas
      
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
      ctx.globalAlpha = opacity;
      ctx.stroke();
      
      // Restore context
      ctx.restore();
    };
    
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        if (currentStroke.current.points.length > 1) {
          registerStroke();
          saveDrawingAsPng();
        }
        setIsDrawing(false);
      }
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isActive, isDrawing, ctx, scale, width, height, color, lineWidth, registerStroke, saveDrawingAsPng]);

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
        <div className="absolute top-[-87px] left-0 right-0 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm py-1 px-4 rounded-t shadow-md w-[550px] select-none">
              <p>Scroll to zoom in/out. Left Click to draw.</p>
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-b shadow z-50 border border-gray-300 w-[550px] items-center">
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
              
              <div className="flex items-center gap-1 w-[80px]">
                <label className="text-xs font-medium text-black whitespace-nowrap w-[30px]">Color:</label>
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
            saveDrawingAsPng();
          }
          setIsDrawing(false);
        }}
        // onMouseLeave={stopDrawing}
      />
    </div>
  );
} 