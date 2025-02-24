import React from 'react';
import { Document, Page } from 'react-pdf';

interface PDFPageArrangerProps {
    pages: number[];
    pdfUrl: string;
    setPages: (newPages: number[]) => void;
}

const PDFPageArranger: React.FC<PDFPageArrangerProps> = ({ pages, pdfUrl, setPages }) => {
    return (
        <div className="grid grid-cols-2 gap-4 p-4">
            {pages.map((pageNum) => (
                <div 
                    key={pageNum}
                    className="border rounded cursor-move bg-white shadow-md"
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', pageNum.toString());
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
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
                    }}
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
    );
};

export default PDFPageArranger; 