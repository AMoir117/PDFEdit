'use client';

import Link from 'next/link';
import type { PDFFile } from '@/types/pdf';

interface NavbarProps {
  setPdfFile: (file: PDFFile | null) => void;
}

export default function Navbar({ setPdfFile }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button 
              onClick={() => setPdfFile(null)}
              className="flex items-center"
            >
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold mr-2">
                
              </div>
              <span className="text-xl font-semibold">PDF Editor</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 