'use client';

import { useState, useEffect } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';

interface PDFTextLayerProps {
  page: PDFPageProxy;
  scale: number;
  isActive: boolean;
}

interface TextEdit {
  id: string;
  x: number;
  y: number;
  text: string;
}

export default function PDFTextLayer({ page, scale, isActive }: PDFTextLayerProps) {
  const [textEdits, setTextEdits] = useState<TextEdit[]>([]);
  const [selectedEdit, setSelectedEdit] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!isActive) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newEdit: TextEdit = {
      id: Date.now().toString(),
      x,
      y,
      text: 'New Text'
    };

    setTextEdits([...textEdits, newEdit]);
    setSelectedEdit(newEdit.id);
  };

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full"
      onClick={handleClick}
    >
      {textEdits.map((edit) => (
        <div
          key={edit.id}
          className="absolute"
          style={{
            left: `${edit.x * scale}px`,
            top: `${edit.y * scale}px`,
          }}
        >
          {selectedEdit === edit.id ? (
            <input
              type="text"
              value={edit.text}
              onChange={(e) => {
                setTextEdits(textEdits.map(t => 
                  t.id === edit.id ? { ...t, text: e.target.value } : t
                ));
              }}
              onBlur={() => setSelectedEdit(null)}
              autoFocus
              className="border rounded px-1"
            />
          ) : (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEdit(edit.id);
              }}
              className="cursor-text"
            >
              {edit.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 