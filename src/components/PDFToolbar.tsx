'use client';

export type EditMode = 'view' | 'text' | 'draw' | 'arrange';

interface PDFToolbarProps {
  mode: EditMode;
  onModeChange: (mode: EditMode) => void;
  children?: React.ReactNode;
}

export default function PDFToolbar({ mode, onModeChange, children }: PDFToolbarProps) {
  return (
    <div className="flex items-center justify-between py-2 text-black">
      <div className="flex space-x-2">
        <h1 className="text-2xl ">Toolbar |</h1>
        <button
          onClick={() => onModeChange('view')}
          className={`px-3 py-1 rounded ${
            mode === 'view' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          View
        </button>
        <button
          onClick={() => onModeChange('text')}
          className={`px-3 py-1 rounded ${
            mode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Edit Text
        </button>
        <button
          onClick={() => onModeChange('draw')}
          className={`px-3 py-1 rounded relative ${
            mode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Draw&nbsp;    
          <span className="relative inline-block">
            <span className="text-orange-600 cursor-pointer">(!)</span>
            <span className="absolute left-1/2 transform -translate-x-1/2 -translate-y-8 bg-orange-200 text-orange-800 text-xs p-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200">
              Feature currently only works for 1 page PDFs.
            </span>
          </span>
        </button>
        <button
          onClick={() => onModeChange('arrange')}
          className={`px-3 py-1 rounded ${
            mode === 'arrange' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Arrange Pages
        </button>
      </div>
      <div className="flex-1" />
      {children}
    </div>
  );
} 