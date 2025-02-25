'use client';

import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import Modal from 'react-modal';

// Set the app element for accessibility
Modal.setAppElement('#root'); // Replace with your actual app element ID

interface PDFPageArrangerProps {
    pages: number[];
    pdfUrl: string;
    setPages: (newPages: number[]) => void;
}

const PDFPageArranger: React.FC<PDFPageArrangerProps> = ({ pages, pdfUrl, setPages }) => {
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
                appElement={document.getElementById('pg-arrange') || undefined} // Ensure this matches your app element
                style={{
                    content: {
                        maxWidth: '300px', // Set a maximum width for the modal
                        maxHeight: '160px', // Set a maximum height for the modal
                        margin: 'auto', // Center the modal
                        color: 'black', // Set font color to black
                    },
                }}
            >
                <h2>Confirm Deletion</h2>
                <p>Are you sure you want to delete page {pageToDelete}?</p>
                <button 
                    onClick={confirmDelete} 
                    style={{ backgroundColor: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Yes
                </button>
                <button 
                    onClick={cancelDelete} 
                    style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    No
                </button>
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