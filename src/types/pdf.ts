export type PDFFile = File | { url: string } | { data: Uint8Array } | null;

export interface PDFPage {
    pageNumber: number;
    rotation: number;
}

