'use client';

import type { PDFFile } from '@/types/pdf';

export type EditMode = 'view' | 'text' | 'draw' | 'arrange';

interface PDFToolbarProps {
  mode: EditMode;
  onModeChange: (mode: EditMode) => void;
  setPdfFile: (file: PDFFile | null) => void;
  children?: React.ReactNode;
}

export default function PDFToolbar({ mode, onModeChange, setPdfFile, children }: PDFToolbarProps) {
  return (
    <div className="flex items-center justify-between py-3 text-black">
      <div className="flex space-x-3 items-center">
        <h1 className="text-xl font-medium text-gray-700 pr-3 border-r border-gray-200">Tools</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => onModeChange('view')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 ${
              mode === 'view' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View</span>
          </button>
          <button
            onClick={() => onModeChange('text')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 ${
              mode === 'text' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Add Text</span>
          </button>
          <button
            onClick={() => onModeChange('draw')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 ${
              mode === 'draw' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Draw/Sign</span>
          </button>
          <button
            onClick={() => onModeChange('arrange')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 ${
              mode === 'arrange' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Arrange Pages</span>
          </button>
        </div>
      </div>
      <div className="flex-1" />
      <div className="ml-4 flex items-center space-x-2">
        <button
          onClick={() => setPdfFile(null)}
          className="px-4 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset</span>
        </button>
        {children}
      </div>
    </div>
  );
} 