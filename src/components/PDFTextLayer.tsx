'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TextBox } from '@/types/pdf';
import { v4 as uuidv4 } from 'uuid';

interface PDFTextLayerProps {
  width: number;
  height: number;
  scale: number;
  isActive: boolean;
  pageNumber: number;
  onTextBoxesChange: (textBoxes: TextBox[]) => void;
  textBoxesByPage: Record<number, TextBox[]>;
}

// List of standard fonts available in most browsers
const FONT_OPTIONS = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' }
];

export default function PDFTextLayer({ width, height, scale, isActive, pageNumber, onTextBoxesChange, textBoxesByPage }: PDFTextLayerProps) {
  const [selectedTextBox, setSelectedTextBox] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  const [textColor, setTextColor] = useState<string>('#000000');
  const [selectedFont, setSelectedFont] = useState<string>(FONT_OPTIONS[0].value);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const textBoxRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const textAreaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const layerRef = useRef<HTMLDivElement>(null);
  
  // Get text boxes for the current page
  const textBoxes = textBoxesByPage[pageNumber] || [];

  const addNewTextBox = () => {
    if (!isActive) return;
    
    // Place the text box in the center of the visible area
    const posX = width / 2;
    const posY = height / 2;
    
    const newTextBox: TextBox = {
      id: uuidv4(),
      content: 'New text',
      x: posX,
      y: posY,
      width: 150,
      height: 40,
      fontSize,
      color: textColor,
      fontFamily: selectedFont,
      pageNumber
    };
    
    const updatedTextBoxes = {
      ...textBoxesByPage,
      [pageNumber]: [...(textBoxesByPage[pageNumber] || []), newTextBox]
    };
    
    onTextBoxesChange(Object.values(updatedTextBoxes).flat());
    setSelectedTextBox(newTextBox.id);
    
    // Set this new text box to edit mode
    setEditMode(prev => ({ ...prev, [newTextBox.id]: true }));
    
    // Focus the new text box after a short delay to ensure the ref is set
    setTimeout(() => {
      if (textAreaRefs.current[newTextBox.id]) {
        textAreaRefs.current[newTextBox.id]?.focus();
        textAreaRefs.current[newTextBox.id]?.select();
      }
    }, 50);
  };

  const handleAddButtonClick = () => {
    // Add text box at the center of the visible area
    addNewTextBox();
  };

  const updateTextBox = (id: string, changes: Partial<TextBox>) => {
    const updatedTextBoxes = { ...textBoxesByPage };
    
    if (updatedTextBoxes[pageNumber]) {
      updatedTextBoxes[pageNumber] = updatedTextBoxes[pageNumber].map(box => 
        box.id === id ? { ...box, ...changes } : box
      );
    }
    
    onTextBoxesChange(Object.values(updatedTextBoxes).flat());
  };

  const handleTextChange = (id: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTextBox(id, { content: e.target.value });
  };

  const handleTextBoxClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTextBox(id);
    
    // Focus the textarea if in edit mode
    if (editMode[id] && textAreaRefs.current[id]) {
      textAreaRefs.current[id]?.focus();
    }
  };

  

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if (!isActive || !editMode[id]) return;
    
    // Only start dragging if we're clicking on the move handle or the background
    // Don't start dragging when clicking on the textarea
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    
    e.stopPropagation();
    setSelectedTextBox(id);
    setIsDragging(true);
    
    const textBox = textBoxes.find(box => box.id === id);
    if (textBox) {
      // Store the offset from the mouse to the top-left corner of the text box
      setDragOffset({ 
        x: (e.clientX / scale) - textBox.x, 
        y: (e.clientY / scale) - textBox.y 
      });
    }
  };

  


  const handleDeleteTextBox = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedTextBoxes = { ...textBoxesByPage };
    
    if (updatedTextBoxes[pageNumber]) {
      updatedTextBoxes[pageNumber] = updatedTextBoxes[pageNumber].filter(box => box.id !== id);
    }
    
    onTextBoxesChange(Object.values(updatedTextBoxes).flat());
    setSelectedTextBox(null);
    
    // Remove from edit mode tracking
    setEditMode(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // Update font for the selected text box
  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFont(e.target.value);
    if (selectedTextBox) {
      updateTextBox(selectedTextBox, { fontFamily: e.target.value });
    }
  };

  // Confirm and finish editing text box
  const handleConfirmTextBox = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditMode(prev => ({ ...prev, [id]: false }));
    setSelectedTextBox(null);
  };

  // Handle resize with the resize handle
  const handleResizeStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive || !editMode[id]) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const textBox = textBoxes.find(box => box.id === id);
    if (!textBox) return;
    
    const startWidth = textBox.width;
    const startHeight = textBox.height;
    
    const handleResizeMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      
      updateTextBox(id, {
        width: Math.max(50, startWidth + deltaX),
        height: Math.max(20, startHeight + deltaY)
      });
    };
    
    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Global mouse event handlers to ensure drag operations work properly
  const handleGlobalMouseDown = () => {
    // Logic is handled by component-specific handlers
  };
  
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging || !selectedTextBox) return;
    
    const x = (e.clientX / scale) - dragOffset.x;
    const y = (e.clientY / scale) - dragOffset.y;
    
    updateTextBox(selectedTextBox, { x, y });
  };
  
  const handleGlobalMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    // When mode switches to isActive, make sure the layer is clickable
    if (isActive) {
      document.addEventListener('mousedown', handleGlobalMouseDown);
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalMouseDown);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isActive, isDragging, selectedTextBox, scale, dragOffset, updateTextBox]);

  // Support for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || !selectedTextBox) return;
      
      // Delete selected text box with Delete key
      if (e.key === 'Delete') {
        const updatedTextBoxes = { ...textBoxesByPage };
        
        if (updatedTextBoxes[pageNumber]) {
          updatedTextBoxes[pageNumber] = updatedTextBoxes[pageNumber].filter(box => box.id !== selectedTextBox);
        }
        
        onTextBoxesChange(Object.values(updatedTextBoxes).flat());
        setSelectedTextBox(null);
        
        // Remove from edit mode tracking
        setEditMode(prev => {
          const updated = { ...prev };
          delete updated[selectedTextBox];
          return updated;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectedTextBox, pageNumber, textBoxesByPage, onTextBoxesChange]);

  // Adding direct click handler to the parent div 
  const handleTextBoxContainerClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedTextBox(id);
  };

  // Enhanced overlay click handler
  const handleOverlayClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedTextBox(id);
  };

  // Enhanced overlay double-click handler
  const handleOverlayDoubleClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setEditMode(prev => ({ ...prev, [id]: true }));
    setSelectedTextBox(id);
    
    // Focus the textarea after a short delay
    setTimeout(() => {
      if (textAreaRefs.current[id]) {
        textAreaRefs.current[id]?.focus();
      }
    }, 50);
  };

  return (
    <div className="absolute top-0 left-0 z-30" style={{ width: '100%', height: '100%' }}>
      {isActive && (
        <div className="absolute top-[-87px] left-0 right-0 flex justify-center">
          <div className="flex flex-col items-center w-full max-w-[1200px]">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm py-1 px-4 rounded-t shadow-md w-full select-none">
              <p className="text-center">Click anywhere to add text. Double-click text to edit.</p>
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-b shadow z-50 border border-gray-300 w-full items-center">
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-black whitespace-nowrap">Size:</label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setFontSize(newSize);
                    if (selectedTextBox) {
                      updateTextBox(selectedTextBox, { fontSize: newSize });
                    }
                  }}
                  className="w-16"
                />
                <span className="text-xs font-medium text-black min-w-[18px] text-center">{fontSize}px</span>
              </div>
              
              <div className="border-l border-gray-300 h-6 mx-1"></div>
              
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-black whitespace-nowrap">Color:</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    if (selectedTextBox) {
                      updateTextBox(selectedTextBox, { color: e.target.value });
                    }
                  }}
                  className="w-6 h-6"
                />
              </div>
              
              <div className="border-l border-gray-300 h-6 mx-1"></div>
              
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-black whitespace-nowrap">Font:</label>
                <select 
                  value={selectedFont}
                  onChange={handleFontChange}
                  className="p-1 border rounded text-sm w-28"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Text Layer with Text Boxes */}
      <div 
        ref={layerRef}
        className={`absolute top-0 left-0 w-full h-full ${isActive ? '' : 'pointer-events-none'}`}
        style={{ 
          pointerEvents: 'none', // Prevents clicks on the layer itself
          overflow: 'visible', // Allow text boxes to be visible outside the PDF area
          zIndex: 50 // Ensure the text layer is above PDF content
        }}
      >
        {textBoxes.map((textBox) => (
          <div
            key={textBox.id}
            ref={el => { textBoxRefs.current[textBox.id] = el; }}
            className={`absolute group ${isActive ? '' : 'pointer-events-none'} ${
              selectedTextBox === textBox.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : isActive ? 'hover:ring-1 hover:ring-blue-300 hover:shadow' : ''
            }`}
            style={{
              left: textBox.x * scale,
              top: textBox.y * scale,
              width: textBox.width * scale,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              zIndex: selectedTextBox === textBox.id ? 60 : 55, // Higher z-index to ensure it's above PDF content
              pointerEvents: isActive ? 'auto' : 'none', // Only make it clickable when text mode is active
              cursor: editMode[textBox.id] ? 'default' : 'pointer',
              // Add a subtle outline to ensure visibility outside PDF area
              outline: '1px dashed rgba(0,0,0,0.1)',
              boxShadow: 'rgba(0,0,0,0.05) 0 0 5px'
            }}
            onClick={(e) => handleTextBoxContainerClick(textBox.id, e)}
            onDoubleClick={(e) => handleOverlayDoubleClick(textBox.id, e)}
          >
            {/* Background overlay that ensures the entire box is clickable */}
            <div 
              className={`absolute inset-0 ${
                isActive && selectedTextBox === textBox.id && editMode[textBox.id] 
                  ? 'bg-blue-50 bg-opacity-10' 
                  : 'bg-white bg-opacity-5' // Very subtle background to ensure it's clickable
              }`}
              style={{ pointerEvents: 'none' }}
            />
            
            {/* The actual text content */}
            {editMode[textBox.id] ? (
              <textarea
                ref={el => { textAreaRefs.current[textBox.id] = el; }}
                value={textBox.content}
                onChange={(e) => updateTextBox(textBox.id, { content: e.target.value })}
                style={{
                  width: '100%',
                  height: '100%',
                  fontFamily: textBox.fontFamily,
                  fontSize: textBox.fontSize,
                  color: textBox.color,
                  resize: 'none',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0',
                  margin: '0',
                  overflow: 'hidden'
                }}
                onBlur={() => setEditMode(prev => ({ ...prev, [textBox.id]: false }))}
                autoFocus
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  fontFamily: textBox.fontFamily,
                  fontSize: textBox.fontSize,
                  color: textBox.color,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  pointerEvents: 'none'
                }}
              >
                {textBox.content}
              </div>
            )}
            
            {/* Resize handle */}
            {isActive && selectedTextBox === textBox.id && editMode[textBox.id] && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-blue-500 rounded-bl"
                style={{
                  transform: 'translate(50%, 50%)',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => handleResizeStart(textBox.id, e)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}