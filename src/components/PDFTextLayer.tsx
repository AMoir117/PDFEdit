'use client';

import React, { useEffect, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';

interface PDFTextLayerProps {
  page: PDFPageProxy;
  scale: number;
  isActive: boolean;
  textAnnotations: { id: string; content: string; x: number; y: number }[];
  onTextChange: (id: string, newText: string) => void;
}

interface TextEdit {
  id: string;
  x: number;
  y: number;
  text: string;
}

export default function PDFTextLayer({ page, scale, isActive, textAnnotations, onTextChange }: PDFTextLayerProps) {
  const textRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleTextChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    onTextChange(id, e.target.value);
  };

  return (
    <div className="text-layer">
      {textAnnotations.map(({ id, content, x, y }) => (
        <div
          key={id}
          ref={el => { textRefs.current[id] = el; }}
          style={{ position: 'absolute', left: x, top: y }}
        >
          <input
            type="text"
            value={content}
            onChange={e => handleTextChange(id, e)}
            style={{ width: '100px' }}
          />
        </div>
      ))}
    </div>
  );
}