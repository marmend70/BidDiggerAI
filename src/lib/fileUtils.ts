
import { PDFDocument } from 'pdf-lib';

export async function countPdfPages(file: File): Promise<number> {
    if (file.type !== 'application/pdf') return 0;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        // ignoreEncryption: try to load even if encrypted (metadata might be readable or it fails later)
        // If it fails, we catch it.
        return pdfDoc.getPageCount();
    } catch (error) {
        console.error("Error counting PDF pages:", error);
        return 0;
    }
}
