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
  drawings: string[];
}

export default function PDFDownloader({ drawingLayerRef, numPages, mode, pageDimensions, pages, file, drawings }: PDFDownloaderProps) {
  const handleDownload = async () => {
    try {
      if (!file) throw new Error('No file provided');

      // Debugging: Log the file type and content
      console.log('File:', file);
      console.log('File Type:', file instanceof File ? 'File' : typeof file);

      // Check if the file is a valid PDF
      if (file instanceof Blob) {
        // Check if the Blob is a PDF
        const blobType = file.type;
        if (blobType !== 'application/pdf') {
          throw new Error('Invalid file format: Not a PDF');
        }
      } else if (!(file instanceof File) && !('url' in file) && !('data' in file)) {
        throw new Error('Invalid file format');
      }

      // Load the original PDF
      const existingPdfBytes = await (async () => {
        if (file instanceof File) {
          return new Uint8Array(await file.arrayBuffer());
        } else if (file instanceof Blob) {
          return new Uint8Array(await file.arrayBuffer()); // Handle Blob directly
        } else if ('url' in file) {
          const response = await fetch(file.url);
          if (!response.ok) throw new Error('Failed to fetch PDF from URL');
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

        if (mode === 'draw') {
          // Get the drawing for the current page from the drawings array
          const drawingDataUrl = drawings[pageNum - 1]; // Access the drawing for the specific page
          if (drawingDataUrl) {
            const drawingImage = await newPdfDoc.embedPng(await fetch(drawingDataUrl).then(res => res.arrayBuffer()));
            const page = newPdfDoc.getPage(newPdfDoc.getPageCount() - 1); // Get the last added page
            page.drawImage(drawingImage, {
              x: 0,
              y: 0,
              width: page.getWidth(),
              height: page.getHeight(),
            });
          }
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