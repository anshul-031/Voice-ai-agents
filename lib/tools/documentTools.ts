/**
 * Document & File Tools Definitions
 * 
 * Tools for creating, editing, reading documents and files
 * Each tool can be enabled/disabled per agent
 */

export interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
  enum?: string[];
  items?: {
    type: string;
    properties?: Record<string, any>;
  };
  properties?: Record<string, any>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, ToolParameter>;
  example?: Record<string, any>;
}

export const DOCUMENT_TOOLS: Record<string, ToolDefinition> = {
  pdf_maker: {
    name: 'pdf_maker',
    description: 'Create professional PDF documents with text, tables, images, headers, and footers. Perfect for invoices, reports, certificates, letters, etc.',
    category: 'document',
    parameters: {
      title: {
        type: 'string',
        description: 'Document title (also used for filename if not specified)',
        required: true,
      },
      fileName: {
        type: 'string',
        description: 'Optional custom filename (without extension). If not provided, LLM should generate a meaningful name based on content.',
        required: false,
      },
      content: {
        type: 'array',
        description: 'Array of content sections to include in the PDF',
        required: true,
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['heading', 'paragraph', 'table', 'list', 'image', 'spacer', 'line'],
              description: 'Type of content section',
            },
            text: {
              type: 'string',
              description: 'Text content for heading, paragraph, or list items',
            },
            level: {
              type: 'number',
              description: 'Heading level (1-6) for headings',
            },
            rows: {
              type: 'array',
              description: 'Table rows - array of arrays for table type',
            },
            headers: {
              type: 'array',
              description: 'Table column headers',
            },
            items: {
              type: 'array',
              description: 'List items for list type',
            },
            ordered: {
              type: 'boolean',
              description: 'Whether list is ordered (numbered)',
            },
            imageUrl: {
              type: 'string',
              description: 'Image URL for image type',
            },
            height: {
              type: 'number',
              description: 'Spacer height in points or image height',
            },
          },
        },
      },
      metadata: {
        type: 'object',
        description: 'PDF metadata',
        required: false,
        properties: {
          author: { type: 'string' },
          subject: { type: 'string' },
          keywords: { type: 'string' },
        },
      },
      pageSize: {
        type: 'string',
        description: 'Page size (A4, Letter, Legal, etc.)',
        required: false,
        enum: ['A4', 'Letter', 'Legal', 'A3', 'A5'],
      },
    },
    example: {
      title: 'Monthly Sales Report',
      fileName: 'sales_report_oct_2025',
      content: [
        { type: 'heading', text: 'Sales Summary', level: 1 },
        { type: 'paragraph', text: 'This report covers sales performance for October 2025.' },
        { type: 'spacer', height: 10 },
        { type: 'table', headers: ['Product', 'Units', 'Revenue'], rows: [['Product A', '100', '$5000'], ['Product B', '75', '$3750']] },
      ],
      metadata: { author: 'AI Agent', subject: 'Monthly Report' },
    },
  },

  word_creator: {
    name: 'word_creator',
    description: 'Create Microsoft Word (.docx) documents with rich formatting, styles, headers, footers, and images.',
    category: 'document',
    parameters: {
      title: {
        type: 'string',
        description: 'Document title',
        required: true,
      },
      fileName: {
        type: 'string',
        description: 'Optional custom filename (without extension). LLM should generate meaningful name if not provided.',
        required: false,
      },
      sections: {
        type: 'array',
        description: 'Document sections with content',
        required: true,
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['title', 'heading', 'paragraph', 'bulletList', 'numberedList', 'table', 'image', 'pageBreak'],
            },
            text: { type: 'string' },
            level: { type: 'number', description: 'Heading level (1-9)' },
            items: { type: 'array', description: 'List items' },
            rows: { type: 'array', description: 'Table rows' },
            headers: { type: 'array', description: 'Table headers' },
            imageUrl: { type: 'string' },
            bold: { type: 'boolean' },
            italic: { type: 'boolean' },
            underline: { type: 'boolean' },
          },
        },
      },
      properties: {
        type: 'object',
        description: 'Document properties',
        required: false,
        properties: {
          creator: { type: 'string' },
          description: { type: 'string' },
          title: { type: 'string' },
        },
      },
    },
    example: {
      title: 'Project Proposal',
      fileName: 'project_proposal_q4_2025',
      sections: [
        { type: 'title', text: 'Q4 2025 Project Proposal' },
        { type: 'heading', text: 'Executive Summary', level: 1 },
        { type: 'paragraph', text: 'This proposal outlines...' },
      ],
    },
  },

  spreadsheet_creator: {
    name: 'spreadsheet_creator',
    description: 'Create Excel spreadsheets (.xlsx) with multiple sheets, formulas, formatting, and charts.',
    category: 'document',
    parameters: {
      fileName: {
        type: 'string',
        description: 'Filename for the spreadsheet. LLM should generate meaningful name.',
        required: true,
      },
      sheets: {
        type: 'array',
        description: 'Array of worksheets to create',
        required: true,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Sheet name' },
            headers: { type: 'array', description: 'Column headers' },
            data: { type: 'array', description: 'Array of row data' },
            formulas: { type: 'object', description: 'Cell formulas (e.g., {A10: "SUM(A2:A9)"})' },
            columnWidths: { type: 'object', description: 'Column widths in characters' },
          },
        },
      },
    },
    example: {
      fileName: 'expense_report_oct_2025',
      sheets: [
        {
          name: 'Expenses',
          headers: ['Date', 'Category', 'Amount', 'Description'],
          data: [
            ['2025-10-01', 'Travel', 150, 'Flight tickets'],
            ['2025-10-05', 'Meals', 45, 'Team lunch'],
          ],
          formulas: { D3: 'SUM(C2:C3)' },
        },
      ],
    },
  },

  file_reader: {
    name: 'file_reader',
    description: 'Read and extract content from uploaded files (PDF, DOCX, TXT, CSV). Returns the text content or structured data.',
    category: 'document',
    parameters: {
      fileUrl: {
        type: 'string',
        description: 'URL or path to the file to read (can be S3 URL, public URL, or local path)',
        required: true,
      },
      fileType: {
        type: 'string',
        description: 'Type of file to read',
        required: true,
        enum: ['pdf', 'docx', 'txt', 'csv', 'xlsx'],
      },
      extractOptions: {
        type: 'object',
        description: 'Options for content extraction',
        required: false,
        properties: {
          pages: { type: 'array', description: 'Specific page numbers to extract (for PDF)' },
          includeMetadata: { type: 'boolean', description: 'Include file metadata' },
          parseTable: { type: 'boolean', description: 'Parse tables in structured format' },
        },
      },
    },
    example: {
      fileUrl: 'https://s3.amazonaws.com/bucket/document.pdf',
      fileType: 'pdf',
      extractOptions: { includeMetadata: true, parseTable: true },
    },
  },

  document_summarizer: {
    name: 'document_summarizer',
    description: 'Read a document and create a concise summary with key points. Can summarize PDFs, Word docs, or text files.',
    category: 'document',
    parameters: {
      fileUrl: {
        type: 'string',
        description: 'URL to the document to summarize',
        required: true,
      },
      fileType: {
        type: 'string',
        description: 'Type of file',
        required: true,
        enum: ['pdf', 'docx', 'txt'],
      },
      summaryLength: {
        type: 'string',
        description: 'Desired summary length',
        required: false,
        enum: ['brief', 'medium', 'detailed'],
      },
      format: {
        type: 'string',
        description: 'Output format for the summary',
        required: false,
        enum: ['text', 'bulletPoints', 'pdf', 'docx'],
      },
      fileName: {
        type: 'string',
        description: 'Output filename if creating a document (LLM generated)',
        required: false,
      },
    },
    example: {
      fileUrl: 'https://s3.amazonaws.com/bucket/annual_report.pdf',
      fileType: 'pdf',
      summaryLength: 'medium',
      format: 'pdf',
      fileName: 'annual_report_summary_2025',
    },
  },

  pdf_editor: {
    name: 'pdf_editor',
    description: 'Edit existing PDFs - merge multiple PDFs, extract pages, add watermarks, or rotate pages.',
    category: 'document',
    parameters: {
      operation: {
        type: 'string',
        description: 'PDF editing operation to perform',
        required: true,
        enum: ['merge', 'split', 'extract', 'rotate', 'watermark'],
      },
      inputFiles: {
        type: 'array',
        description: 'Array of input PDF URLs',
        required: true,
        items: { type: 'string' },
      },
      outputFileName: {
        type: 'string',
        description: 'Output filename (LLM generated based on operation)',
        required: true,
      },
      options: {
        type: 'object',
        description: 'Operation-specific options',
        required: false,
        properties: {
          pages: { type: 'array', description: 'Page numbers for split/extract' },
          rotation: { type: 'number', description: 'Rotation angle (90, 180, 270)' },
          watermarkText: { type: 'string', description: 'Watermark text' },
        },
      },
    },
    example: {
      operation: 'merge',
      inputFiles: [
        'https://s3.amazonaws.com/bucket/doc1.pdf',
        'https://s3.amazonaws.com/bucket/doc2.pdf',
      ],
      outputFileName: 'merged_documents_oct_2025',
    },
  },
};

/**
 * Get all available document tools
 */
export function getAllDocumentTools(): ToolDefinition[] {
  return Object.values(DOCUMENT_TOOLS);
}

/**
 * Get tool definition by name
 */
export function getToolByName(toolName: string): ToolDefinition | undefined {
  return DOCUMENT_TOOLS[toolName];
}

/**
 * Convert tool definitions to Gemini function calling format
 */
export function getGeminiToolDefinitions(): any[] {
  return getAllDocumentTools().map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters,
      required: Object.entries(tool.parameters)
        .filter(([_, param]) => param.required)
        .map(([name]) => name),
    },
  }));
}

/**
 * Get tools by category
 */
export function getToolsByCategory(): Record<string, ToolDefinition[]> {
  const tools = getAllDocumentTools();
  return tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolDefinition[]>);
}

/**
 * Tool display information for UI
 */
export const TOOL_DISPLAY_INFO = {
  pdf_maker: {
    icon: '📄',
    label: 'PDF Maker',
    description: 'Create professional PDF documents',
    color: '#EF4444',
  },
  word_creator: {
    icon: '📝',
    label: 'Word Creator',
    description: 'Generate DOCX files',
    color: '#3B82F6',
  },
  spreadsheet_creator: {
    icon: '📊',
    label: 'Spreadsheet Creator',
    description: 'Create Excel/CSV files',
    color: '#10B981',
  },
  file_reader: {
    icon: '📖',
    label: 'File Reader',
    description: 'Read uploaded documents',
    color: '#8B5CF6',
  },
  document_summarizer: {
    icon: '📋',
    label: 'Document Summarizer',
    description: 'Summarize documents',
    color: '#F59E0B',
  },
  pdf_editor: {
    icon: '✏️',
    label: 'PDF Editor',
    description: 'Merge & edit PDFs',
    color: '#EC4899',
  },
};
