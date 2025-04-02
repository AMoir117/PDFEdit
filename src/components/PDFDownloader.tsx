'use client';

import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFDrawingLayerRef } from './PDFDrawingLayer';
import type { PDFFile, TextBox } from '@/types/pdf';

interface PDFDownloaderProps {
  drawingLayerRef: React.RefObject<PDFDrawingLayerRef | null>;
  numPages: number;
  mode: 'draw' | 'arrange' | 'view' | 'text';
  pageDimensions: { width: number; height: number };
  pages?: number[];
  file: PDFFile;
  drawings: string[];
  textBoxes: TextBox[];
}

export default function PDFDownloader({  numPages,  pages, file, drawings, textBoxes }: PDFDownloaderProps) {
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

      // For each page in the rearranged order, merge the drawings and text boxes
      const pageOrder = pages || Array.from({ length: numPages }, (_, i) => i + 1); // Default to original order if pages is undefined

      for (const pageNum of pageOrder) {
        const index = pageNum - 1; // Adjust for zero-based index
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [index]); // Copy the page from the original document
        newPdfDoc.addPage(copiedPage); // Add the copied page to the new document
        const currentPage = newPdfDoc.getPage(newPdfDoc.getPageCount() - 1);
        const { width, height } = currentPage.getSize();

        // Add drawings to the PDF if available
        const drawingDataUrl = drawings[pageNum - 1]; // Access the drawing for the specific page
        if (drawingDataUrl) {
          const drawingImage = await newPdfDoc.embedPng(await fetch(drawingDataUrl).then(res => res.arrayBuffer()));
          currentPage.drawImage(drawingImage, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }

        // Add text boxes to the PDF
        const pageTextBoxes = textBoxes.filter(tb => tb.pageNumber === pageNum);
        if (pageTextBoxes.length > 0) {
          // Use Helvetica as the fallback font
          
          for (const textBox of pageTextBoxes) {
            // Use Standard fonts that PDF supports
            const fontName = getFontNameForPdf(textBox.fontFamily);
            const font = await newPdfDoc.embedFont(fontName);
            
            // Convert coordinates to PDF coordinates (PDF origin is bottom-left, browser is top-left)
            // Position is relative to the page coordinates
            currentPage.drawText(textBox.content, {
              x: textBox.x,
              y: height - textBox.y - textBox.height/2, // Flip y-coordinate
              size: textBox.fontSize,
              font: font,
              color: hexToRgb(textBox.color),
              maxWidth: textBox.width,
              lineHeight: textBox.fontSize * 1.2
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
      link.download = 'edited-document.pdf'; // Updated filename
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  // Helper function to convert hex color to RGB color using pdf-lib's rgb function
  const hexToRgb = (hex: string) => {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    
    return rgb(r, g, b);
  };

  // Helper function to map CSS font families to PDF standard fonts
  const getFontNameForPdf = (fontFamily: string): string => {
    // Extract the first font from the font-family string
    const firstFont = fontFamily.split(',')[0].trim().toLowerCase().replace(/['"]/g, '');
    
    // Map to PDF standard fonts
    switch (firstFont) {
      case 'times new roman':
      case 'times':
        return 'Times-Roman';
      case 'courier new':
      case 'courier':
        return 'Courier';
      case 'helvetica':
      case 'arial':
      case 'verdana':
        return 'Helvetica';
      default:
        return 'Helvetica'; // Default fallback
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>Save PDF</span>
    </button>
  );
} 