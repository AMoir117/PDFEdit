'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import type { PDFFile } from '@/types/pdf';

interface PDFUploaderProps {
  onFileUpload: (file: PDFFile) => void;
}

export default function PDFUploader({ onFileUpload }: PDFUploaderProps) {
  const [isMerging, setIsMerging] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsMerging(true);
      
      // Check if multiple files are uploaded
      if (acceptedFiles.length > 1) {
        const mergedPdf = await mergePDFs(acceptedFiles);
        onFileUpload(mergedPdf);
      } else {
        // If only one file is uploaded, directly upload it
        const singleFile = acceptedFiles[0];
        const pdfBytes = await singleFile.arrayBuffer();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        onFileUpload(pdfBlob as PDFFile);
      }

      setIsMerging(false);
    }
  }, [onFileUpload]);

  const mergePDFs = async (files: File[]): Promise<PDFFile> => {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const pdfBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfFile = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfFile], { type: 'application/pdf' });
    return mergedBlob as PDFFile;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  return (
    <div 
      {...getRootProps()} 
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400"
    >
      <input {...getInputProps()} />
      {isMerging ? (
        <p>Merging files, please wait...</p>
      ) : isDragActive ? (
        <p>Drop the PDF files here...</p>
      ) : (
        <p>Drag and drop PDF files here, or click to select them</p>
      )}
    </div>
  );
}