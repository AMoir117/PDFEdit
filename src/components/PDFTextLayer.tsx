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
    <>
      {/* Text Box Tools Bar - Positioned above the PDF */}
      {isActive && (
        <div className="absolute top-[-106px] left-0 right-0 flex flex-col items-center">
          {/* Instructions bar */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm py-1 px-4 rounded-t shadow-md w-[550px] select-none">
            {selectedTextBox ? (
              <p>Double-click to edit text boxes. Click on the green check mark to save your changes.</p>
            ) : (
              <p>Click the &quot;Add Text Box&quot; button to create a new text box. Double-click any existing text box to edit it.</p>
            )}
          </div>
          
          {/* Tools bar */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-b shadow-md z-20 border border-gray-300 text-black w-[550px] select-none">
            <button
              onClick={handleAddButtonClick}
              className="bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600 whitespace-nowrap"
            >
              + Add Text Box
            </button>
            
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
            
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-black whitespace-nowrap">Size:</label>
              <input
                type="number"
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
                className="w-12 p-1 border rounded"
              />
            </div>
            
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
            
            <textarea
              ref={el => { textAreaRefs.current[textBox.id] = el; }}
              value={textBox.content}
              onChange={(e) => handleTextChange(textBox.id, e)}
              style={{
                width: `${textBox.width}px`,
                height: `${textBox.height}px`,
                fontSize: `${textBox.fontSize}px`,
                color: textBox.color,
                fontFamily: textBox.fontFamily || FONT_OPTIONS[0].value,
                backgroundColor: 'transparent', // Fully transparent background
                resize: 'none', // We'll handle resize with our custom handle
                border: selectedTextBox === textBox.id && editMode[textBox.id] && isActive ? '1px dashed #aaa' : 'none',
                padding: '4px',
                outline: 'none',
                overflow: 'hidden',
                cursor: 'text',
                position: 'relative',
                zIndex: editMode[textBox.id] ? 20 : 1, // Only higher than overlay when in edit mode
                pointerEvents: isActive && editMode[textBox.id] ? 'auto' : 'none', // Only allow interaction in edit mode
                userSelect: isActive && editMode[textBox.id] ? 'text' : 'none', // Only allow text selection in edit mode
                WebkitUserSelect: isActive && editMode[textBox.id] ? 'text' : 'none',
                MozUserSelect: isActive && editMode[textBox.id] ? 'text' : 'none',
                msUserSelect: isActive && editMode[textBox.id] ? 'text' : 'none'
              }}
              readOnly={!isActive || !editMode[textBox.id]}
              placeholder="Enter text here..."
              onClick={(e) => {
                if (isActive && editMode[textBox.id]) {
                  e.stopPropagation();
                  handleTextBoxClick(textBox.id, e);
                }
              }}
            />
            
            {/* Only show these controls when in edit mode and selected */}
            {selectedTextBox === textBox.id && editMode[textBox.id] && isActive && (
              <>
                {/* Both buttons next to each other */}
                <div className="absolute -top-3 -right-3 flex z-30">
                  {/* Confirm button - now next to Delete button */}
                  <button
                    className="mr-1 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-green-600"
                    onClick={(e) => handleConfirmTextBox(textBox.id, e)}
                    title="Confirm text box"
                  >
                    ✓
                  </button>
                
                  {/* Delete button */}
                  <button
                    className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    onClick={(e) => {
                      if (isActive) {
                        handleDeleteTextBox(textBox.id, e);
                      }
                    }}
                    title="Delete text box"
                  >
                    ×
                  </button>
                </div>
                
                {/* Custom resize handle */}
                <div 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 cursor-se-resize z-30 hover:bg-blue-600"
                  onMouseDown={(e) => handleResizeStart(textBox.id, e)}
                  title="Resize text box"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" className="absolute top-2 left-2 fill-white">
                    <path d="M22 22H17V20H20V17H22V22ZM9 20V22H14V20H9ZM2 20V17H4V20H7V22H2ZM20 9H22V14H20V9ZM20 2V7H22V2H17V4H7V2H2V7H4V14H2V17H4V14H7V17H9V14H14V17H17V14H20V9H17V7H14V4H17V2H20Z" />
                  </svg>
                </div>
                
                {/* Move handle */}
                <div 
                  className="absolute -top-3 left-0 right-0 h-3 bg-blue-500 cursor-move z-30 mx-auto w-16 rounded-t"
                  onMouseDown={(e) => {
                    if (isActive) {
                      handleMouseDown(textBox.id, e);
                    }
                  }}
                  title="Drag to move"
                />
              </>
            )}
            
            {/* Edit indicator for non-edit mode boxes - full width overlay */}
            {isActive && !editMode[textBox.id] && (
              <div 
                className="absolute inset-0 bg-transparent cursor-pointer z-10 hover:bg-blue-50 hover:bg-opacity-10 select-none"
                title="Double-click to edit"
                onClick={(e) => handleOverlayClick(textBox.id, e)}
                onDoubleClick={(e) => handleOverlayDoubleClick(textBox.id, e)}
                style={{ 
                  pointerEvents: 'auto', 
                  width: '100%', 
                  height: '100%',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
              >
              </div>
            )}
        </div>
      ))}
    </div>
    </>
  );
}