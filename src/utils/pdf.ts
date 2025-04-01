import type { DrawingStroke } from '@/types/pdf';
import type { Dispatch, SetStateAction } from 'react';

export const saveDrawingAsPng = (
  canvas: HTMLCanvasElement | null,
  pageNum: number,
  localDrawings: string[],
  setLocalDrawings: Dispatch<SetStateAction<string[]>>
) => {
  if (!canvas) return;
  
  const dataUrl = canvas.toDataURL('image/png');
  setLocalDrawings((prev: string[]) => {
    const newDrawings = [...prev];
    // Ensure the array has enough elements
    while (newDrawings.length < pageNum) {
      newDrawings.push('');
    }
    newDrawings[pageNum - 1] = dataUrl; // Store the drawing for the current page
    return newDrawings;
  });
};

export const redrawStrokes = (
  ctx: CanvasRenderingContext2D,
  strokes: DrawingStroke[],
  scale: number,
  defaultLineWidth: number
) => {
  ctx.save();
  ctx.scale(scale, scale);

  strokes.forEach(stroke => {
    if (stroke.points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    stroke.points.forEach((point, i) => {
      if (i > 0) ctx.lineTo(point.x, point.y);
    });
    
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth || defaultLineWidth;
    ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1.0;
    ctx.stroke();
  });

  ctx.restore();
}; 