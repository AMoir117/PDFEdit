'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import PDFControls from './PDFControls';
import PDFToolbar, { EditMode } from './PDFToolbar';
import PDFDrawingLayer, { PDFDrawingLayerRef } from './PDFDrawingLayer';
import PDFTextLayer from './PDFTextLayer';
import PDFViewLayer from './PDFViewLayer';
import type { PDFFile, TextBox } from '@/types/pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
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
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<string[]>([]);
  const [textBoxesByPage, setTextBoxesByPage] = useState<Record<number, TextBox[]>>({});
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);

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

  // Function to handle drawings change
  const handleDrawingsChange = (newDrawings: string[]) => {
    // Ensure we preserve any drawings in pages we haven't seen yet
    setDrawings(prev => {
      // Create a new array with same length as numPages or longer if newDrawings is longer
      const result = [...prev];
      
      // Only update if we have actual changes to prevent rerender loops
      let hasChanges = false;
      
      // Update with new drawings
      newDrawings.forEach((drawing, index) => {
        if (drawing && drawing !== result[index]) { // Only update non-empty drawings that changed
          result[index] = drawing;
          hasChanges = true;
        }
      });
      
      // Only return a new array if we have changes
      return hasChanges ? result : prev;
    });
  };

  // Function to handle text boxes change
  const handleTextBoxesChange = (newTextBoxes: TextBox[]) => {
    // Group text boxes by page number
    const byPage: Record<number, TextBox[]> = {};
    newTextBoxes.forEach(box => {
      if (!byPage[box.pageNumber]) {
        byPage[box.pageNumber] = [];
      }
      byPage[box.pageNumber].push(box);
    });
    
    setTextBoxesByPage(byPage);
    setTextBoxes(newTextBoxes);
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
              drawings={drawings}
              textBoxes={textBoxes}
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
      ) : null}

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
              <div className="relative bg-white shadow-lg" style={{ marginTop: mode === 'text' ? '80px' : mode === 'draw' ? '70px' : '0' }}>
                <div id={`page-${pageNumber}`} className="relative">
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale}
                    onLoadSuccess={onPageLoadSuccess}
                  >
                    {/* View layer */}
                    <PDFViewLayer
                      width={pageDimensions.width}
                      height={pageDimensions.height}
                      scale={scale}
                      isActive={mode === 'view'}
                      onScaleChange={handleScaleChange}
                    />
                    
                    {/* Text layer for adding text boxes */}
                    <PDFTextLayer
                      width={pageDimensions.width}
                      height={pageDimensions.height}
                      scale={scale}
                      isActive={mode === 'text'}
                      pageNumber={pageNumber}
                      onTextBoxesChange={handleTextBoxesChange}
                      textBoxesByPage={textBoxesByPage}
                    />
                    
                    {/* Always render drawing layer to persist drawings */}
                    <PDFDrawingLayer
                      width={pageDimensions.width}
                      height={pageDimensions.height}
                      scale={scale}
                      isActive={mode === 'draw'}
                      onScaleChange={handleScaleChange}
                      onRegisterCanvas={registerDrawingLayer}
                      pageNumber={pageNumber}
                      onDrawingsChange={handleDrawingsChange}
                      initialDrawings={drawings}
                    />
                  </Page>
                </div>
              </div>
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}