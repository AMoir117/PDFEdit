import type { DrawingStroke } from '@/types/pdf';

export const setupCanvasContext = (canvas: HTMLCanvasElement, scale: number, width: number, height: number) => {
  canvas.width = width * scale;
  canvas.height = height * scale;
  
  const context = canvas.getContext('2d');
  if (context) {
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }
  return context;
};

export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  scale: number,
  defaultLineWidth: number
) => {
  if (stroke.points.length < 2) return;
  
  ctx.save();
  ctx.scale(scale, scale);
  
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  
  stroke.points.forEach((point, i) => {
    if (i > 0) ctx.lineTo(point.x, point.y);
  });
  
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth || defaultLineWidth;
  ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1.0;
  ctx.stroke();
  
  ctx.restore();
};

export const getMousePosition = (
  e: MouseEvent | React.MouseEvent,
  canvas: HTMLCanvasElement,
  scale: number
) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;
  return { x, y };
};

export const isWithinCanvas = (
  position: { x: number; y: number },
  width: number,
  height: number
) => {
  return position.x >= 0 && position.x <= width && position.y >= 0 && position.y <= height;
}; 