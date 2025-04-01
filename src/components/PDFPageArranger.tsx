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
    const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
    const [documentError, setDocumentError] = useState<string | null>(null);

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

    const handlePageLoadSuccess = (pageNum: number) => {
        setLoadedPages(prev => new Set([...prev, pageNum]));
    };

    const handlePageLoadError = (pageNum: number, error: Error) => {
        console.error(`Error loading page ${pageNum}:`, error);
        // Try to reload the page after a short delay
        setTimeout(() => {
            setLoadedPages(prev => {
                const newSet = new Set(prev);
                newSet.delete(pageNum);
                return newSet;
            });
        }, 1000);
    };

    const handleDocumentLoadError = (error: Error) => {
        console.error('Error loading document:', error);
        setDocumentError('Failed to load PDF document. Please try again.');
    };

    return (
        <div className="p-4" id="pg-arrange">
            <Modal
                isOpen={isModalOpen}
                onRequestClose={cancelDelete}
                appElement={document.getElementById('pg-arrange') || undefined}
                style={{
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    content: {
                        maxWidth: '400px',
                        maxHeight: '220px',
                        margin: 'auto',
                        borderRadius: '10px',
                        padding: '20px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
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
            {documentError ? (
                <div className="text-red-500 text-center p-4">{documentError}</div>
            ) : (
                <>
                    <Document 
                        file={pdfUrl}
                        onLoadError={handleDocumentLoadError}
                        loading={
                            <div className="text-center p-4">
                                <div className="animate-pulse">Loading document...</div>
                            </div>
                        }
                    >
                        <div className="flex flex-col items-center">
                            <div className="top-8 z-50 w-full flex justify-center">
                                <div style={{ width: '630px' }}>
                                    <div className="bg-blue-500 text-white text-sm py-1 px-4 rounded-t shadow-md w-full select-none">
                                        <p className="text-center">Arrange and manage pages in your PDF document</p>
                                    </div>
                                    <div className="flex gap-6 bg-white p-2 rounded-b shadow border border-gray-300 w-full items-center justify-center">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                            <span className="text-sm text-gray-600">Drag to rearrange</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="text-sm text-gray-600">Click to delete</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                {pages.map((pageNum) => (
                                    <div 
                                        key={pageNum}
                                        className="border rounded cursor-move bg-white shadow-md relative"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, pageNum)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleDrop(e, pageNum)}
                                        onClick={() => handleDeleteClick(pageNum)}
                                    >
                                        <Page 
                                            key={`${pageNum}-${loadedPages.has(pageNum)}`}
                                            pageNumber={pageNum} 
                                            scale={0.5}
                                            className="pointer-events-none"
                                            onLoadSuccess={() => handlePageLoadSuccess(pageNum)}
                                            onLoadError={(error) => handlePageLoadError(pageNum, error)}
                                            loading={
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                                    <div className="animate-pulse">Loading page {pageNum}...</div>
                                                </div>
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Document>
                </>
            )}
        </div>
    );
};

export default PDFPageArranger; 