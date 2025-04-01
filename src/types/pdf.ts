export type PDFFile = File | { url: string } | { data: Uint8Array } | null;

export interface PDFPage {
    pageNumber: number;
    rotation: number;
}

export interface DrawingStroke {
  points: { x: number; y: number }[]; // Array of points defining the stroke
  color: string; // Color of the stroke
  lineWidth: number; // Width of the stroke
  opacity?: number; // Opacity of the stroke
}

export interface TextBox {
  id: string;
  content: string; 
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string; // Font family for the text
  pageNumber: number;
}

