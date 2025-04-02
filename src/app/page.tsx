'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import PDFUploader from '@/components/PDFUploader';
import type { PDFFile } from '@/types/pdf';

// Dynamically import the PDF viewer with SSR disabled
const DynamicPDFViewer = dynamic(() => import('@/components/DynamicPDFViewer'), {
  ssr: false,
  loading: () => <p className="text-center p-8">Loading PDF editor...</p>
});

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
          <DynamicPDFViewer file={pdfFile} setPdfFile={setPdfFile} />
        )}
      </div>
    </div>
  );
}