'use client';

export type EditMode = 'view' | 'text' | 'draw' | 'arrange';

interface PDFToolbarProps {
  mode: EditMode;
  onModeChange: (mode: EditMode) => void;
  onDownload: () => void;
}

export default function PDFToolbar({ mode, onModeChange, onDownload }: PDFToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b text-black">
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
        className={`px-3 py-1 rounded ${
          mode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        Draw
      </button>
      <button
        onClick={() => onModeChange('arrange')}
        className={`px-3 py-1 rounded ${
          mode === 'arrange' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        Arrange Pages
      </button>
      <div className="flex-1" />
      <button
        onClick={onDownload}
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Download PDF
      </button>
    </div>
  );
} 