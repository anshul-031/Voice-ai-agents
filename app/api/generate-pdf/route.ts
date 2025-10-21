import { jsPDF } from 'jspdf';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

interface PDFSection {
    type: 'heading' | 'text' | 'list' | 'table';
    content: string | string[] | string[][];
    level?: number; // for headings (h1, h2, h3)
}

interface PDFGenerationRequest {
    title: string;
    sections: PDFSection[];
    fileName?: string;
}

/**
 * POST /api/generate-pdf
 * Generate a PDF document based on structured content from the LLM
 */
export async function POST(request: NextRequest) {
    console.log('[generate-pdf] POST request received');

    try {
        const { title, sections, fileName } = await request.json() as PDFGenerationRequest;

        if (!title || !sections || !Array.isArray(sections)) {
            console.error('[generate-pdf] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: title, sections' },
                { status: 400 },
            );
        }

        console.log('[generate-pdf] Generating PDF:', title);

        // Create new PDF document (A4 size)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Helper function to add new page if needed
        const checkPageBreak = (requiredSpace: number = 20) => {
            if (yPosition + requiredSpace > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };

        // Add title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        yPosition += 15;

        // Add horizontal line under title
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Process each section
        for (const section of sections) {
            checkPageBreak();

            switch (section.type) {
            case 'heading':
                const headingLevel = section.level || 1;
                const fontSize = headingLevel === 1 ? 16 : headingLevel === 2 ? 14 : 12;
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', 'bold');
                doc.text(section.content as string, margin, yPosition);
                yPosition += fontSize / 2 + 5;
                break;

            case 'text':
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                const textLines = doc.splitTextToSize(section.content as string, maxWidth);

                for (const line of textLines) {
                    checkPageBreak(10);
                    doc.text(line, margin, yPosition);
                    yPosition += 6;
                }
                yPosition += 4;
                break;

            case 'list':
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                const items = section.content as string[];

                for (const item of items) {
                    checkPageBreak(10);
                    doc.text('•', margin, yPosition);
                    const itemLines = doc.splitTextToSize(item, maxWidth - 10);

                    for (let i = 0; i < itemLines.length; i++) {
                        if (i > 0) {
                            checkPageBreak(10);
                        }
                        doc.text(itemLines[i], margin + 7, yPosition);
                        yPosition += 6;
                    }
                }
                yPosition += 4;
                break;

            case 'table':
                const tableData = section.content as string[][];
                if (tableData.length === 0) break;

                const colWidth = maxWidth / tableData[0].length;
                const rowHeight = 8;

                doc.setFontSize(10);

                for (let i = 0; i < tableData.length; i++) {
                    checkPageBreak(rowHeight + 5);

                    // Header row styling
                    if (i === 0) {
                        doc.setFont('helvetica', 'bold');
                        doc.setFillColor(240, 240, 240);
                        doc.rect(margin, yPosition - 5, maxWidth, rowHeight, 'F');
                    } else {
                        doc.setFont('helvetica', 'normal');
                    }

                    // Draw cells
                    for (let j = 0; j < tableData[i].length; j++) {
                        const x = margin + (j * colWidth);
                        doc.text(tableData[i][j], x + 2, yPosition);

                        // Draw cell borders
                        doc.rect(x, yPosition - 5, colWidth, rowHeight);
                    }

                    yPosition += rowHeight;
                }
                yPosition += 6;
                break;

            default:
                console.error('[generate-pdf] Unknown section type:', section.type);
            }
        }

        // Add footer with page numbers
        const totalPages = doc.internal.pages.length - 1; // Subtract the first empty page
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' },
            );
        }

        // Generate PDF as base64
        const pdfBase64 = doc.output('datauristring');

        console.log('[generate-pdf] PDF generated successfully');

        return NextResponse.json({
            success: true,
            pdfData: pdfBase64,
            fileName: fileName || `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        });

    } catch (error) {
        console.error('[generate-pdf] Error generating PDF:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
