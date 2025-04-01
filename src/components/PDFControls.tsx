'use client';

interface PDFControlsProps {
  pageNumber: number;
  numPages: number | null;
  onPageChange: (newPage: number) => void;
  scale: number;
  onScaleChange: (newScale: number) => void;
}

export default function PDFControls({ 
  pageNumber, 
  numPages, 
  onPageChange,
  scale,
  onScaleChange
}: PDFControlsProps) {
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      onPageChange(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      onPageChange(pageNumber + 1);
    }
  };

  const handleZoomIn = () => {
    onScaleChange(scale + 0.1);
  };

  const handleZoomOut = () => {
    onScaleChange(Math.max(0.1, scale - 0.1));
  };

  return (
    <div className="flex items-center justify-center gap-6 py-3 px-4 bg-gradient-to-r from-white to-gray-50 border-b border-gray-100 text-black shadow-sm">
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={handleZoomOut}
          className="flex items-center px-3 py-1.5 text-sm bg-transparent hover:bg-gray-100 text-gray-700 transition-colors duration-150 border-r border-gray-200"
          disabled={scale <= 0.1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9" />
          </svg>
        </button>
        
        <span className="px-3 text-sm font-medium text-gray-700">
          {(scale * 100).toFixed(0)}%
        </span>
        
        <button
          onClick={handleZoomIn}
          className="flex items-center px-3 py-1.5 text-sm bg-transparent hover:bg-gray-100 text-gray-700 transition-colors duration-150 border-l border-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
          className="flex items-center px-3 py-1.5 text-sm bg-transparent hover:bg-gray-100 text-gray-700 transition-colors duration-150 border-r border-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <span className="px-3 text-sm font-medium text-gray-700">
          {pageNumber} / {numPages || '--'}
        </span>
        
        <button
          onClick={goToNextPage}
          disabled={!numPages || pageNumber >= numPages}
          className="flex items-center px-3 py-1.5 text-sm bg-transparent hover:bg-gray-100 text-gray-700 transition-colors duration-150 border-l border-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}