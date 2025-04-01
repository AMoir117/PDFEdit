

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface CanvasProps {
  pageNumber: number;
  scale: number;
  rotation: number;
}

export default function Canvas({ }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current && !fabricRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 1100,
        backgroundColor: 'transparent',
      });
    }

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, []);

  const addText = () => {
    const text = new fabric.IText('Edit this text', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#000000',
    });
    fabricRef.current?.add(text);
  };

  const toggleDrawing = () => {
    if (!fabricRef.current) return;
    fabricRef.current.isDrawingMode = !fabricRef.current.isDrawingMode;
    fabricRef.current.freeDrawingBrush.width = 2;
    fabricRef.current.freeDrawingBrush.color = '#000000';
  };

  return (
    <div className="relative">
      <div className="mb-4 space-x-2">
        <button 
          onClick={addText}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add Text
        </button>
        <button 
          onClick={toggleDrawing}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Toggle Drawing
        </button>
      </div>
      <canvas ref={canvasRef} className="border border-gray-300" />
    </div>
  );
}