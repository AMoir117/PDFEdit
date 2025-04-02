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
        <>
          <PDFControls 
            pageNumber={pageNumber}
            numPages={numPages}
            onPageChange={setPageNumber}
            scale={scale}
            onScaleChange={handleScaleChange}
          />
          
          {mode === 'draw' && (
            <div className="flex justify-center mt-8 mb-2">
              <div className="flex flex-col items-center max-w-3x1">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm py-1 px-4 rounded-t shadow-md w-full select-none">
                  <p className="text-center">Scroll to zoom in/out. Left Click to draw.</p>
                </div>
                <div className="flex gap-6 bg-white p-2 rounded-b shadow z-50 border border-gray-300 w-full items-center justify-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Size:</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      defaultValue="2"
                      className="w-16"
                      onChange={(e) => {
                        // We'll handle this in the drawing layer through props
                        window.dispatchEvent(new CustomEvent('drawing-size-change', { 
                          detail: Number(e.target.value) 
                        }));
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Color:</label>
                    <input
                      type="color"
                      defaultValue="#000000"
                      className="w-6 h-6"
                      onChange={(e) => {
                        window.dispatchEvent(new CustomEvent('drawing-color-change', { 
                          detail: e.target.value 
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'text' && (
            <div className="flex justify-center mt-8 mb-2">
              <div className="flex flex-col items-center max-w-3x1">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm py-1 px-4 rounded-t shadow-md w-full select-none">
                  <p className="text-center">Double-click any existing text box to edit it.</p>
                </div>
                <div className="flex gap-6 bg-white p-2 rounded-b shadow z-50 border border-gray-300 w-full items-center justify-center">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('add-text-box'));
                    }}
                    className="bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600 whitespace-nowrap"
                  >
                    + Add Text Box
                  </button>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Font:</label>
                    <select
                      className="text-xs px-1 py-0.5 border rounded"
                      onChange={(e) => {
                        window.dispatchEvent(new CustomEvent('text-font-change', { 
                          detail: e.target.value 
                        }));
                      }}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Times New Roman, serif">Times New Roman</option>
                      <option value="Courier New, monospace">Courier New</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Size:</label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      defaultValue="16"
                      className="w-16 px-1 py-0.5 border rounded"
                      onChange={(e) => {
                        window.dispatchEvent(new CustomEvent('text-size-change', { 
                          detail: Number(e.target.value) 
                        }));
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Color:</label>
                    <input
                      type="color"
                      defaultValue="#000000"
                      className="w-6 h-6"
                      onChange={(e) => {
                        window.dispatchEvent(new CustomEvent('text-color-change', { 
                          detail: e.target.value 
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex justify-center mt-8 mb-2">
          <div className="flex flex-col items-center max-w-3x1">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm py-1 px-4 rounded-t shadow-md w-full select-none">
              <p className="text-center">Arrange and manage pages in your PDF document</p>
            </div>
            <div className="flex gap-6 bg-white p-2 rounded-b shadow z-50 border border-gray-300 w-full items-center justify-center">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm text-gray-600">Drag to rearrange</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm text-gray-600">Click to delete</span>
              </div>
            </div>
          </div>
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