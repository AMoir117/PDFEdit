'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import PDFControls from './PDFControls';
import PDFToolbar, { EditMode } from './PDFToolbar';
import PDFDrawingLayer from './PDFDrawingLayer';
import PDFTextLayer from './PDFTextLayer';
import PDFViewLayer from './PDFViewLayer';
import type { PDFFile } from '@/types/pdf';
import type { PDFPageProxy } from 'pdfjs-dist';

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

  const handleDownload = async () => {
    // TODO: Implement download with edits
    console.log('Download with edits');
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
            onDownload={handleDownload}
          />
        </div>
      </div>

      <PDFControls 
        pageNumber={pageNumber}
        numPages={numPages}
        onPageChange={setPageNumber}
        scale={scale}
        onScaleChange={handleScaleChange}
      />

      <div className="flex-1 w-full overflow-auto">
        <div 
          className="min-h-full flex items-center justify-center p-8"
          style={{
            minWidth: pageDimensions.width * scale + 100,
            minHeight: pageDimensions.height * scale + 100
          }}
        >
          {mode === 'arrange' ? (
            <div className="grid grid-cols-2 gap-4 p-4">
              {pages.map((pageNum) => (
                <div 
                  key={pageNum}
                  className="border rounded cursor-move bg-white shadow-md"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', pageNum.toString());
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = parseInt(e.dataTransfer.getData('text/plain'));
                    const to = pageNum;
                    if (from !== to) {
                      const newPages = [...pages];
                      const fromIndex = newPages.indexOf(from);
                      const toIndex = newPages.indexOf(to);
                      newPages.splice(fromIndex, 1);
                      newPages.splice(toIndex, 0, from);
                      setPages(newPages);
                    }
                  }}
                >
                  <Document file={pdfUrl}>
                    <Page 
                      pageNumber={pageNum} 
                      scale={0.5}
                      className="pointer-events-none"
                    />
                  </Document>
                </div>
              ))}
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <div className="relative bg-white shadow-lg">
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
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}