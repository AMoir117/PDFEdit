'use client';

import Link from 'next/link';
import type { PDFFile } from '@/types/pdf';

interface NavbarProps {
  setPdfFile: (file: PDFFile | null) => void;
}

export default function Navbar({ setPdfFile }: NavbarProps) {
  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <button 
            onClick={() => setPdfFile(null)}
            className="flex items-center gap-3 group transition-all duration-300 hover:opacity-80"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm group-hover:shadow-md transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">PDF Editor</span>
              <span className="text-xs text-gray-500">Add Text • Annotate • Arrange</span>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
} 