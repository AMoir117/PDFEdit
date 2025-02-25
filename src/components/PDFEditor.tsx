'use client';

import ReactDOM from 'react-dom';
import { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import PDFControls from './PDFControls';
import PDFToolbar, { EditMode } from './PDFToolbar';
import PDFDrawingLayer, { PDFDrawingLayerRef } from './PDFDrawingLayer';
import PDFTextLayer from './PDFTextLayer';
import PDFViewLayer from './PDFViewLayer';
import type { PDFFile } from '@/types/pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import PDFDownloader from './PDFDownloader';
import PDFPageArranger from './PDFPageArranger';

interface PDFEditorProps {
  file: PDFFile;
}

export default function PDFEditor({ file }: PDFEditorProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<EditMode>('view');
  const [pages, setPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<PDFPageProxy | null>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Add ref to store drawing canvas
  const drawingLayerRef = useRef<PDFDrawingLayerRef>(null);

  useEffect(() => {
    if (file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof file === 'string') {
      setPdfUrl(file);
    }
  }, [file]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPages(Array.from({ length: numPages }, (_, i) => i + 1));
  }

  function onPageLoadSuccess(page: PDFPageProxy) {
    setCurrentPage(page);
    const viewport = page.getViewport({ scale: 1 });
    setPageDimensions({
      width: viewport.width,
      height: viewport.height
    });
  }

  // Function to register the drawing canvas
  const registerDrawingLayer = (canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      drawingLayerRef.current = {
        getPageDrawing: () => canvas
      };
    } else {
      drawingLayerRef.current = null;
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScale(Math.max(0.1, Math.min(5, newScale)));
  };

  if (!pdfUrl) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PDFToolbar 
            mode={mode}
            onModeChange={setMode}
          >
            <PDFDownloader
              drawingLayerRef={drawingLayerRef}
              numPages={numPages || 0}
              mode={mode}
              pageDimensions={pageDimensions}
              pages={mode === 'arrange' ? pages : undefined}
              file={file}
            />
          </PDFToolbar>
        </div>
      </div>
      
      {mode !== 'arrange' ? (
        <PDFControls 
          pageNumber={pageNumber}
          numPages={numPages}
          onPageChange={setPageNumber}
          scale={scale}
          onScaleChange={handleScaleChange}
        />
      ) : (
        <div className="mb-4 p-2 border bg-white text-center text-sm text-black">
            <p className="font-sans">Drag to rearrange pages in PDF</p>
            <p className="font-sans">Click to delete a page</p>
        </div>
      )}

      <div className="flex-1 w-full overflow-auto">
        <div 
          className="min-h-full flex items-center justify-center p-8"
          style={{
            minWidth: pageDimensions.width * scale + 100,
            minHeight: pageDimensions.height * scale + 100
          }}
        >
          {mode === 'arrange' ? (
            <PDFPageArranger 
              pages={pages} 
              pdfUrl={pdfUrl} 
              setPages={setPages} 
            />
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <div className="relative bg-white shadow-lg">
                <div id={`page-${pageNumber}`}>
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale}
                    onLoadSuccess={onPageLoadSuccess}
                  >
                    <PDFDrawingLayer
                      width={pageDimensions.width}
                      height={pageDimensions.height}
                      scale={scale}
                      isActive={mode === 'draw'}
                      onScaleChange={handleScaleChange}
                      onRegisterCanvas={registerDrawingLayer}
                      pageNumber={pageNumber}
                    />
                    <PDFViewLayer
                      width={pageDimensions.width}
                      height={pageDimensions.height}
                      scale={scale}
                      isActive={mode === 'view'}
                      onScaleChange={handleScaleChange}
                    />
                  </Page>
                  {currentPage && (
                    <PDFTextLayer
                      page={currentPage}
                      scale={scale}
                      isActive={mode === 'text'}
                    />
                  )}
                </div>
              </div>
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}