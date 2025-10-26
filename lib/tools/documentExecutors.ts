/**
 *import axios from 'axios';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { uploadDocxToS3, uploadExcelToS3, uploadPDFToS3 } from '../utils/s3Upload';nt Tool Executors
 * 
 * Actual implementations of document generation, reading, and editing tools
 */

import axios from 'axios';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx';
import mammoth from 'mammoth';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { uploadDocxToS3, uploadExcelToS3, uploadPDFToS3 } from '../utils/s3Upload';

interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  fileUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Execute PDF Maker Tool
 */
export async function executePDFMaker(parameters: any): Promise<ToolExecutionResult> {
  try {
    const { title, fileName, content, metadata, pageSize = 'A4' } = parameters;

    // Create PDF document
    const doc = new PDFDocument({
      size: pageSize,
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: title,
        Author: metadata?.author || 'AI Agent',
        Subject: metadata?.subject || '',
        Keywords: metadata?.keywords || '',
      },
    });

    // Collect PDF chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {});

    // Add title
    doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();

    // Add content sections
    for (const section of content) {
      switch (section.type) {
        case 'heading':
          const headingSize = section.level === 1 ? 20 : section.level === 2 ? 16 : 14;
          doc.fontSize(headingSize).font('Helvetica-Bold').text(section.text);
          doc.moveDown(0.5);
          break;

        case 'paragraph':
          doc.fontSize(12).font('Helvetica').text(section.text, { align: 'left' });
          doc.moveDown();
          break;

        case 'table':
          // Simple table rendering
          if (section.headers) {
            doc.fontSize(10).font('Helvetica-Bold');
            const headerText = section.headers.join('  |  ');
            doc.text(headerText);
            doc.moveDown(0.3);
          }
          
          doc.fontSize(10).font('Helvetica');
          for (const row of section.rows || []) {
            const rowText = Array.isArray(row) ? row.join('  |  ') : row;
            doc.text(rowText);
          }
          doc.moveDown();
          break;

        case 'list':
          doc.fontSize(12).font('Helvetica');
          const items = section.items || [];
          items.forEach((item: string, index: number) => {
            const bullet = section.ordered ? `${index + 1}. ` : '• ';
            doc.text(`${bullet}${item}`, { indent: 20 });
          });
          doc.moveDown();
          break;

        case 'spacer':
          doc.moveDown(section.height || 1);
          break;

        case 'line':
          doc.moveTo(50, doc.y)
            .lineTo(doc.page.width - 50, doc.y)
            .stroke();
          doc.moveDown();
          break;

        case 'image':
          if (section.imageUrl) {
            try {
              const response = await axios.get(section.imageUrl, { responseType: 'arraybuffer' });
              doc.image(response.data, { fit: [500, 300] });
              doc.moveDown();
            } catch (err) {
              console.error('Failed to load image:', err);
            }
          }
          break;
      }
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to finish
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    // Combine chunks into buffer
    const pdfBuffer = Buffer.concat(chunks);

    // Upload to S3
    const generatedFileName = fileName || title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const uploadResult = await uploadPDFToS3(pdfBuffer, generatedFileName);

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload PDF to S3',
      };
    }

    return {
      success: true,
      fileUrl: uploadResult.url,
      data: {
        fileName: `${generatedFileName}.pdf`,
        fileSize: pdfBuffer.length,
        pageCount: content.length,
      },
      metadata: {
        title,
        createdAt: new Date().toISOString(),
        contentType: 'application/pdf',
      },
    };
  } catch (error) {
    console.error('PDF Maker error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Execute Word Creator Tool
 */
export async function executeWordCreator(parameters: any): Promise<ToolExecutionResult> {
  try {
    const { title, fileName, sections, properties } = parameters;

    // Build document sections
    const docSections: any[] = [];

    for (const section of sections) {
      switch (section.type) {
        case 'title':
          docSections.push(
            new Paragraph({
              text: section.text,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            })
          );
          break;

        case 'heading':
          const level = section.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2;
          docSections.push(
            new Paragraph({
              text: section.text,
              heading: level,
            })
          );
          break;

        case 'paragraph':
          docSections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: section.text,
                  bold: section.bold,
                  italics: section.italic,
                  underline: section.underline ? {} : undefined,
                }),
              ],
            })
          );
          break;

        case 'bulletList':
          section.items?.forEach((item: string) => {
            docSections.push(
              new Paragraph({
                text: item,
                bullet: { level: 0 },
              })
            );
          });
          break;

        case 'numberedList':
          section.items?.forEach((item: string, index: number) => {
            docSections.push(
              new Paragraph({
                text: item,
                numbering: { reference: 'default-numbering', level: 0 },
              })
            );
          });
          break;

        case 'table':
          if (section.headers && section.rows) {
            const tableRows = [
              new TableRow({
                children: section.headers.map(
                  (header: string) =>
                    new TableCell({
                      children: [new Paragraph({ text: header, bold: true })],
                    })
                ),
              }),
              ...section.rows.map(
                (row: string[]) =>
                  new TableRow({
                    children: row.map(
                      (cell: string) =>
                        new TableCell({
                          children: [new Paragraph(cell)],
                        })
                    ),
                  })
              ),
            ];

            docSections.push(
              new Table({
                rows: tableRows,
              })
            );
          }
          break;
      }
    }

    // Create document
    const doc = new Document({
      properties: {
        title: properties?.title || title,
        creator: properties?.creator || 'AI Agent',
        description: properties?.description || '',
      },
      sections: [
        {
          children: docSections,
        },
      ],
    });

    // Generate buffer
    const docxBuffer = await Packer.toBuffer(doc);

    // Upload to S3
    const generatedFileName = fileName || title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const uploadResult = await uploadDocxToS3(Buffer.from(docxBuffer), generatedFileName);

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload DOCX to S3',
      };
    }

    return {
      success: true,
      fileUrl: uploadResult.url,
      data: {
        fileName: `${generatedFileName}.docx`,
        fileSize: docxBuffer.length,
      },
      metadata: {
        title,
        createdAt: new Date().toISOString(),
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    };
  } catch (error) {
    console.error('Word Creator error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate Word document',
    };
  }
}

/**
 * Execute Spreadsheet Creator Tool
 */
export async function executeSpreadsheetCreator(parameters: any): Promise<ToolExecutionResult> {
  try {
    const { fileName, sheets } = parameters;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
      const { name, headers, data, columnWidths } = sheet;

      // Prepare data with headers
      const wsData = headers ? [headers, ...data] : data;

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths if provided
      if (columnWidths) {
        worksheet['!cols'] = Object.entries(columnWidths).map(([col, width]) => ({
          wch: width as number,
        }));
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Upload to S3
    const uploadResult = await uploadExcelToS3(Buffer.from(excelBuffer), fileName);

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload Excel to S3',
      };
    }

    return {
      success: true,
      fileUrl: uploadResult.url,
      data: {
        fileName: `${fileName}.xlsx`,
        fileSize: excelBuffer.length,
        sheetCount: sheets.length,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };
  } catch (error) {
    console.error('Spreadsheet Creator error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate spreadsheet',
    };
  }
}

/**
 * Execute File Reader Tool
 */
export async function executeFileReader(parameters: any): Promise<ToolExecutionResult> {
  try {
    const { fileUrl, fileType, extractOptions = {} } = parameters;

    // Download file
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(response.data);

    let content: any;
    let metadata: any = {};

    switch (fileType) {
      case 'pdf':
        const pdfParser = new PDFParse({ buffer: fileBuffer });
        const pdfResult = await pdfParser.getText();
        content = pdfResult.text;
        metadata = {
          pages: pdfResult.metadata?.info?.Pages || 0,
        };
        break;

      case 'docx':
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        content = docxResult.value;
        break;

      case 'txt':
        content = fileBuffer.toString('utf-8');
        break;

      case 'csv':
        const csvText = fileBuffer.toString('utf-8');
        const lines = csvText.split('\n').map((line) => line.split(','));
        content = {
          headers: lines[0],
          rows: lines.slice(1),
        };
        break;

      case 'xlsx':
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        content = XLSX.utils.sheet_to_json(worksheet);
        break;

      default:
        return {
          success: false,
          error: `Unsupported file type: ${fileType}`,
        };
    }

    return {
      success: true,
      data: {
        content,
        fileType,
        fileUrl,
      },
      metadata: extractOptions.includeMetadata ? metadata : undefined,
    };
  } catch (error) {
    console.error('File Reader error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
}

/**
 * Execute Document Summarizer Tool
 */
export async function executeDocumentSummarizer(parameters: any): Promise<ToolExecutionResult> {
  try {
    const { fileUrl, fileType, summaryLength = 'medium', format = 'text', fileName } = parameters;

    // First, read the document
    const readResult = await executeFileReader({ fileUrl, fileType });
    
    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        error: 'Failed to read document for summarization',
      };
    }

    const content = readResult.data.content;

    // Basic summarization (you can integrate with GPT API for better results)
    let summary: string;
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    
    const maxSentences = summaryLength === 'brief' ? 3 : summaryLength === 'medium' ? 5 : 10;
    summary = sentences.slice(0, maxSentences).join('. ') + '.';

    // Return based on format
    if (format === 'text' || format === 'bulletPoints') {
      return {
        success: true,
        data: {
          summary,
          originalLength: content.length,
          summaryLength: summary.length,
        },
      };
    }

    // Generate PDF or DOCX summary
    if (format === 'pdf') {
      const pdfResult = await executePDFMaker({
        title: 'Document Summary',
        fileName: fileName || 'document_summary',
        content: [
          { type: 'heading', text: 'Summary', level: 1 },
          { type: 'paragraph', text: summary },
        ],
      });
      return pdfResult;
    }

    if (format === 'docx') {
      const docxResult = await executeWordCreator({
        title: 'Document Summary',
        fileName: fileName || 'document_summary',
        sections: [
          { type: 'heading', text: 'Summary', level: 1 },
          { type: 'paragraph', text: summary },
        ],
      });
      return docxResult;
    }

    return {
      success: true,
      data: { summary },
    };
  } catch (error) {
    console.error('Document Summarizer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize document',
    };
  }
}

/**
 * Execute PDF Editor Tool
 */
export async function executePDFEditor(parameters: any): Promise<ToolExecutionResult> {
  try {
    const { operation, inputFiles, outputFileName, options = {} } = parameters;

    // Note: Full PDF editing requires additional libraries like pdf-lib
    // This is a placeholder implementation
    
    return {
      success: false,
      error: 'PDF editing feature is under development. Please use pdf-lib library for implementation.',
    };
  } catch (error) {
    console.error('PDF Editor error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to edit PDF',
    };
  }
}

/**
 * Main router function to execute tools
 */
export async function executeDocumentTool(
  toolName: string,
  parameters: any
): Promise<ToolExecutionResult> {
  switch (toolName) {
    case 'pdf_maker':
      return executePDFMaker(parameters);
    
    case 'word_creator':
      return executeWordCreator(parameters);
    
    case 'spreadsheet_creator':
      return executeSpreadsheetCreator(parameters);
    
    case 'file_reader':
      return executeFileReader(parameters);
    
    case 'document_summarizer':
      return executeDocumentSummarizer(parameters);
    
    case 'pdf_editor':
      return executePDFEditor(parameters);
    
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
  }
}
