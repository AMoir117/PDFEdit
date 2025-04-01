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
      // Set worker source using CDN to avoid the Promise.withResolvers issue
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      // Debug version info
      console.log('PDF.js version:', pdfjs.version);
      console.log('Current worker src:', pdfjs.GlobalWorkerOptions.workerSrc);
    }
  }, []);

  return <PDFEditor file={file} />;
} 