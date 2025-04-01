'use client';

import { useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import PDFEditor from './PDFEditor';
import type { PDFFile } from '@/types/pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

interface DynamicPDFViewerProps {
  file: PDFFile;
}

export default function DynamicPDFViewer({ file }: DynamicPDFViewerProps) {
  useEffect(() => {
    // Only run in the browser
    if (typeof window !== 'undefined') {
      // Set worker source using the specific CDN link
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.269/build/pdf.worker.min.mjs';
      
      // Debug version info
      console.log('PDF.js version:', pdfjs.version);
      console.log('Current worker src:', pdfjs.GlobalWorkerOptions.workerSrc);
    }
  }, []);

  return <PDFEditor file={file} />;
} 