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
    <div className="flex items-center justify-center gap-4 p-4 bg-white border-b text-black">
      <button
        onClick={handleZoomOut}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        disabled={scale <= 0.1}
      >
        Zoom Out
      </button>
      
      <span className="text-sm text-gray-600">
        {(scale * 100).toFixed(0)}%
      </span>
      
      <button
        onClick={handleZoomIn}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
      >
        Zoom In
      </button>

      <div className="h-6 w-px bg-gray-300 mx-2" />

      <button
        onClick={goToPrevPage}
        disabled={pageNumber <= 1}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
      >
        Previous
      </button>
      
      <span className="text-sm text-gray-600">
        Page {pageNumber} of {numPages || '--'}
      </span>
      
      <button
        onClick={goToNextPage}
        disabled={!numPages || pageNumber >= numPages}
        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}