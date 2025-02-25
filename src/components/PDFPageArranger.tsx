'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import Modal from 'react-modal';

// Set the app element for accessibility
Modal.setAppElement('#root'); // Replace with your actual app element ID

interface PDFPageArrangerProps {
    pages: number[];
    pdfUrl: string;
    setPages: (newPages: number[]) => void;
}

const useSuppressWarning = (warningMessage: string) => {
    useEffect(() => {
        const originalConsoleError = console.error;

        console.error = (...args) => {
            if (args[0] && typeof args[0] === 'string' && args[0].includes(warningMessage)) {
                return; // Ignore the specific warning
            }
            originalConsoleError(...args); // Call the original console.error for other errors
        };

        return () => {
            console.error = originalConsoleError; // Restore original console.error on cleanup
        };
    }, [warningMessage]);
};

const PDFPageArranger: React.FC<PDFPageArrangerProps> = ({ pages, pdfUrl, setPages }) => {
    useSuppressWarning('AbortException: TextLayer task cancelled');

    let isDragging = false;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, pageNum: number) => {
        isDragging = true;
        e.dataTransfer.setData('text/plain', pageNum.toString());
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, pageNum: number) => {
        e.preventDefault();
        if (isDragging) {
            const from = parseInt(e.dataTransfer.getData('text/plain'));
            const to = pageNum;
            if (from !== to) {
                const newPages = [...pages];
                const fromIndex = newPages.indexOf(from);
                const toIndex = newPages.indexOf(to);
                newPages.splice(fromIndex, 1);
                newPages.splice(toIndex, 0, from);
                setPages(newPages);
            }
            isDragging = false; // Reset dragging state
        }
    };

    const handleDeleteClick = (pageNum: number) => {
        setPageToDelete(pageNum);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (pageToDelete !== null) {
            const newPages = pages.filter((num) => num !== pageToDelete);
            setPages(newPages);
            setPageToDelete(null);
        }
        setIsModalOpen(false);
    };

    const cancelDelete = () => {
        setPageToDelete(null);
        setIsModalOpen(false);
    };

    return (
        <div className="p-4" id="pg-arrange">
            <Modal
                isOpen={isModalOpen}
                onRequestClose={cancelDelete}
                appElement={document.getElementById('pg-arrange') || undefined}
                style={{
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
                    },
                    content: {
                        maxWidth: '400px', // Increased max width
                        maxHeight: '220px', // Increased max height
                        margin: 'auto',
                        borderRadius: '10px', // Rounded corners
                        padding: '20px', // Added padding
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', // Subtle shadow
                        color: 'black',
                    },
                }}
            >
                <h2 style={{ fontSize: '1.5em', marginBottom: '10px' }}>Confirm Deletion</h2>
                <p style={{ marginBottom: '20px' }}>Are you sure you want to delete page {pageToDelete}?</p>
                <p style={{ marginBottom: '20px' }}>This action cannot be undone.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button 
                        onClick={confirmDelete} 
                        style={{ 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            padding: '10px 15px', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'} // Darker green on hover
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'} // Original color
                    >
                        Yes
                    </button>
                    <button 
                        onClick={cancelDelete} 
                        style={{ 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            padding: '10px 15px', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'} // Darker red on hover
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'} // Original color
                    >
                        No
                    </button>
                </div>
            </Modal>
            <div className="grid grid-cols-2 gap-4">
                {pages.map((pageNum) => (
                    <div 
                        key={pageNum}
                        className="border rounded cursor-move bg-white shadow-md"
                        draggable
                        onDragStart={(e) => handleDragStart(e, pageNum)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, pageNum)}
                        onClick={() => handleDeleteClick(pageNum)}
                    >
                        <Document file={pdfUrl}>
                            <Page 
                                pageNumber={pageNum} 
                                scale={0.5}
                                className="pointer-events-none"
                            />
                        </Document>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PDFPageArranger; 