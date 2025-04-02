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
    <div className="flex flex-col ">
      <div 
        {...getRootProps()} 
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 flex-grow"
      >
        <input {...getInputProps()} />
        {isMerging ? (
          <p>Merging files, please wait...</p>
        ) : isDragActive ? (
          <p>Drop the PDF files here...</p>
        ) : (
          <p>Drag and drop PDF files here, or click to open file browser.</p>
        )}
        <p className="mt-4 text-gray-600 text-sm">Select Multiple PDFs to Merge</p>
        <p className="mt-4 text-gray-600 text-sm">Draw/Sign, Re-Arrange & Delete PDF Pages</p>
      
      </div>
      <footer className="mt-4 text-center text-gray-500 text-xs">
        <p>
          Site made by <a href="https://www.linkedin.com/in/andrew-g-moir/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Andrew M</a> | <a href="https://github.com/AMoir117/PDFEdit" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
