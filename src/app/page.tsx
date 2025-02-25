'use client';

import { useState } from 'react';
import { pdfjs } from 'react-pdf';
import Navbar from '@/components/Navbar';
import PDFUploader from '@/components/PDFUploader';
import PDFEditor from '@/components/PDFEditor';
import type { PDFFile } from '@/types/pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';


// Let's try explicitly setting the worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Debug version info
console.log('PDF.js version:', pdfjs.version);
console.log('Current worker src:', pdfjs.GlobalWorkerOptions.workerSrc);

export default function Home() {
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);

  const handleFileUpload = (file: PDFFile) => {
    setPdfFile(file);
  };

  return (
    <div className="h-full flex flex-col">
      <Navbar setPdfFile={setPdfFile} />
      <div className="flex-1">
        {!pdfFile ? (
          <div className="container mx-auto px-4 py-8">
            <PDFUploader onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <PDFEditor file={pdfFile} />
        )}
      </div>
    </div>
  );
}