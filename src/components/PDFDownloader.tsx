'use client';

import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import type { PDFDrawingLayerRef } from './PDFDrawingLayer';
import type { PDFFile } from '@/types/pdf';

interface PDFDownloaderProps {
  drawingLayerRef: React.RefObject<PDFDrawingLayerRef | null>;
  numPages: number;
  mode: 'draw' | 'arrange' | 'view' | 'text';
  pageDimensions: { width: number; height: number };
  pages?: number[];
  file: PDFFile;
}

export default function PDFDownloader({ drawingLayerRef, numPages, mode, pageDimensions, pages, file }: PDFDownloaderProps) {
  const handleDownload = async () => {
    try {
      if (!file) throw new Error('No file provided');

      // Load the original PDF
      const existingPdfBytes = await (async () => {
        if (file instanceof File) {
          return new Uint8Array(await file.arrayBuffer());
        } else if ('url' in file) {
          const response = await fetch(file.url);
          return new Uint8Array(await response.arrayBuffer());
        } else if ('data' in file) {
          return new Uint8Array(file.data.buffer);
        }
        throw new Error('Invalid file format');
      })();
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const newPdfDoc = await PDFDocument.create(); // Create a new PDF document

      // For each page in the rearranged order, merge the drawings
      const pageOrder = pages || Array.from({ length: numPages }, (_, i) => i + 1); // Default to original order if pages is undefined

      for (const pageNum of pageOrder) {
        const index = pageNum - 1; // Adjust for zero-based index
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [index]); // Copy the page from the original document
        newPdfDoc.addPage(copiedPage); // Add the copied page to the new document

        if (mode === 'draw' && drawingLayerRef.current) {
          // Get the drawing for the current page
          const drawingCanvas = drawingLayerRef.current.getPageDrawing(pageNum);
          const drawingBytes = await new Promise<Uint8Array>(resolve => {
            drawingCanvas.toBlob(async blob => {
              const arrayBuffer = await blob!.arrayBuffer();
              resolve(new Uint8Array(arrayBuffer));
            }, 'image/png');
          });

          const drawingImage = await newPdfDoc.embedPng(drawingBytes);
          const page = newPdfDoc.getPage(newPdfDoc.getPageCount() - 1); // Get the last added page
          page.drawImage(drawingImage, {
            x: 0,
            y: 0,
            width: page.getWidth(),
            height: page.getHeight(),
          });
        }
      }

      // Save the new PDF
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'rearranged-document.pdf'; // Updated filename
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Download
    </button>
  );
} 