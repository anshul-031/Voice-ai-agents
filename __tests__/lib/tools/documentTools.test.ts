/**
 * Unit Tests for Document Tools Definitions
 * Tests tool schemas, Gemini conversion, and utility functions
 * Target: >90% code coverage
 */

import {
    DOCUMENT_TOOLS,
    getAllDocumentTools,
    getGeminiToolDefinitions,
    getToolByName,
    getToolsByCategory,
    TOOL_DISPLAY_INFO,
} from '@/lib/tools/documentTools';

describe('documentTools', () => {
  describe('DOCUMENT_TOOLS constant', () => {
    it('should have 6 tools defined', () => {
      expect(Object.keys(DOCUMENT_TOOLS)).toHaveLength(6);
    });

    it('should contain all expected tool names', () => {
      const toolNames = Object.keys(DOCUMENT_TOOLS);
      expect(toolNames).toContain('pdf_maker');
      expect(toolNames).toContain('word_creator');
      expect(toolNames).toContain('spreadsheet_creator');
      expect(toolNames).toContain('file_reader');
      expect(toolNames).toContain('document_summarizer');
      expect(toolNames).toContain('pdf_editor');
    });

    it('should have correct structure for each tool', () => {
      Object.values(DOCUMENT_TOOLS).forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('parameters');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.category).toBe('string');
        expect(typeof tool.parameters).toBe('object');
      });
    });
  });

  describe('pdf_maker tool', () => {
    const pdfMaker = DOCUMENT_TOOLS.pdf_maker;

    it('should have correct name and category', () => {
      expect(pdfMaker.name).toBe('pdf_maker');
      expect(pdfMaker.category).toBe('document');
    });

    it('should have required parameters', () => {
      expect(pdfMaker.parameters).toHaveProperty('title');
      expect(pdfMaker.parameters).toHaveProperty('content');
      expect(pdfMaker.parameters.title.required).toBe(true);
      expect(pdfMaker.parameters.content.required).toBe(true);
    });

    it('should have optional parameters', () => {
      expect(pdfMaker.parameters).toHaveProperty('fileName');
      expect(pdfMaker.parameters).toHaveProperty('metadata');
      expect(pdfMaker.parameters).toHaveProperty('pageSize');
      expect(pdfMaker.parameters.fileName.required).toBe(false);
    });

    it('should have valid example', () => {
      expect(pdfMaker.example).toBeDefined();
      if (pdfMaker.example) {
        expect(pdfMaker.example).toHaveProperty('title');
        expect(pdfMaker.example).toHaveProperty('content');
        expect(Array.isArray((pdfMaker.example as any).content)).toBe(true);
      }
    });

    it('should have content array with proper structure', () => {
      expect(pdfMaker.parameters.content.type).toBe('array');
      expect(pdfMaker.parameters.content.items).toBeDefined();
      expect(pdfMaker.parameters.content.items?.properties).toHaveProperty('type');
    });
  });

  describe('word_creator tool', () => {
    const wordCreator = DOCUMENT_TOOLS.word_creator;

    it('should have correct configuration', () => {
      expect(wordCreator.name).toBe('word_creator');
      expect(wordCreator.category).toBe('document');
      expect(wordCreator.parameters).toHaveProperty('title');
      expect(wordCreator.parameters).toHaveProperty('sections');
    });

    it('should have sections parameter with proper structure', () => {
      expect(wordCreator.parameters.sections.type).toBe('array');
      expect(wordCreator.parameters.sections.required).toBe(true);
      expect(wordCreator.parameters.sections.items).toBeDefined();
    });
  });

  describe('spreadsheet_creator tool', () => {
    const spreadsheetCreator = DOCUMENT_TOOLS.spreadsheet_creator;

    it('should have correct configuration', () => {
      expect(spreadsheetCreator.name).toBe('spreadsheet_creator');
      expect(spreadsheetCreator.category).toBe('document');
      expect(spreadsheetCreator.parameters).toHaveProperty('fileName');
      expect(spreadsheetCreator.parameters).toHaveProperty('sheets');
    });

    it('should have sheets parameter with array structure', () => {
      expect(spreadsheetCreator.parameters.sheets.type).toBe('array');
      expect(spreadsheetCreator.parameters.sheets.required).toBe(true);
    });
  });

  describe('file_reader tool', () => {
    const fileReader = DOCUMENT_TOOLS.file_reader;

    it('should have correct configuration', () => {
      expect(fileReader.name).toBe('file_reader');
      expect(fileReader.category).toBe('document');
      expect(fileReader.parameters).toHaveProperty('fileUrl');
      expect(fileReader.parameters).toHaveProperty('fileType');
    });

    it('should have fileType enum with supported formats', () => {
      expect(fileReader.parameters.fileType.enum).toContain('pdf');
      expect(fileReader.parameters.fileType.enum).toContain('docx');
      expect(fileReader.parameters.fileType.enum).toContain('txt');
      expect(fileReader.parameters.fileType.enum).toContain('csv');
      expect(fileReader.parameters.fileType.enum).toContain('xlsx');
    });
  });

  describe('document_summarizer tool', () => {
    const summarizer = DOCUMENT_TOOLS.document_summarizer;

    it('should have correct configuration', () => {
      expect(summarizer.name).toBe('document_summarizer');
      expect(summarizer.category).toBe('document');
      expect(summarizer.parameters).toHaveProperty('fileUrl');
      expect(summarizer.parameters).toHaveProperty('fileType');
    });

    it('should have summaryLength enum', () => {
      expect(summarizer.parameters.summaryLength?.enum).toContain('brief');
      expect(summarizer.parameters.summaryLength?.enum).toContain('medium');
      expect(summarizer.parameters.summaryLength?.enum).toContain('detailed');
    });

    it('should have format enum', () => {
      expect(summarizer.parameters.format?.enum).toContain('text');
      expect(summarizer.parameters.format?.enum).toContain('bulletPoints');
      expect(summarizer.parameters.format?.enum).toContain('pdf');
      expect(summarizer.parameters.format?.enum).toContain('docx');
    });
  });

  describe('pdf_editor tool', () => {
    const pdfEditor = DOCUMENT_TOOLS.pdf_editor;

    it('should have correct configuration', () => {
      expect(pdfEditor.name).toBe('pdf_editor');
      expect(pdfEditor.category).toBe('document');
      expect(pdfEditor.parameters).toHaveProperty('operation');
      expect(pdfEditor.parameters).toHaveProperty('inputFiles');
    });

    it('should have operation enum with all operations', () => {
      expect(pdfEditor.parameters.operation.enum).toContain('merge');
      expect(pdfEditor.parameters.operation.enum).toContain('split');
      expect(pdfEditor.parameters.operation.enum).toContain('extract');
      expect(pdfEditor.parameters.operation.enum).toContain('rotate');
      expect(pdfEditor.parameters.operation.enum).toContain('watermark');
    });
  });

  describe('getAllDocumentTools()', () => {
    it('should return all tools as an array', () => {
      const tools = getAllDocumentTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(6);
    });

    it('should return tools with all required properties', () => {
      const tools = getAllDocumentTools();
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('category');
        expect(tool).toHaveProperty('parameters');
      });
    });
  });

  describe('getToolByName()', () => {
    it('should return correct tool by name', () => {
      const tool = getToolByName('pdf_maker');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('pdf_maker');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = getToolByName('non_existent_tool');
      expect(tool).toBeUndefined();
    });

    it('should return correct tool for all tool names', () => {
      const toolNames = ['pdf_maker', 'word_creator', 'spreadsheet_creator', 'file_reader', 'document_summarizer', 'pdf_editor'];
      toolNames.forEach((name) => {
        const tool = getToolByName(name);
        expect(tool).toBeDefined();
        expect(tool?.name).toBe(name);
      });
    });
  });

  describe('getGeminiToolDefinitions()', () => {
    it('should return array of tool definitions', () => {
      const definitions = getGeminiToolDefinitions();
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions).toHaveLength(6);
    });

    it('should have Gemini-compatible structure', () => {
      const definitions = getGeminiToolDefinitions();
      definitions.forEach((def) => {
        expect(def).toHaveProperty('name');
        expect(def).toHaveProperty('description');
        expect(def).toHaveProperty('parameters');
        expect(def.parameters).toHaveProperty('type');
        expect(def.parameters.type).toBe('object');
        expect(def.parameters).toHaveProperty('properties');
        expect(def.parameters).toHaveProperty('required');
      });
    });

    it('should include required fields in Gemini format', () => {
      const definitions = getGeminiToolDefinitions();
      const pdfMakerDef = definitions.find((d) => d.name === 'pdf_maker');
      
      expect(pdfMakerDef).toBeDefined();
      expect(Array.isArray(pdfMakerDef?.parameters.required)).toBe(true);
      expect(pdfMakerDef?.parameters.required).toContain('title');
      expect(pdfMakerDef?.parameters.required).toContain('content');
    });

    it('should convert all tools correctly', () => {
      const definitions = getGeminiToolDefinitions();
      const toolNames = definitions.map((d) => d.name);
      
      expect(toolNames).toContain('pdf_maker');
      expect(toolNames).toContain('word_creator');
      expect(toolNames).toContain('spreadsheet_creator');
      expect(toolNames).toContain('file_reader');
      expect(toolNames).toContain('document_summarizer');
      expect(toolNames).toContain('pdf_editor');
    });
  });

  describe('getToolsByCategory()', () => {
    it('should group tools by category', () => {
      const grouped = getToolsByCategory();
      expect(typeof grouped).toBe('object');
      expect(grouped).toHaveProperty('document');
    });

    it('should have all tools in document category', () => {
      const grouped = getToolsByCategory();
      expect(grouped.document).toHaveLength(6);
    });

    it('should have correct tool structures in each category', () => {
      const grouped = getToolsByCategory();
      Object.values(grouped).forEach((categoryTools) => {
        categoryTools.forEach((tool) => {
          expect(tool).toHaveProperty('name');
          expect(tool).toHaveProperty('description');
          expect(tool).toHaveProperty('category');
          expect(tool).toHaveProperty('parameters');
        });
      });
    });
  });

  describe('TOOL_DISPLAY_INFO constant', () => {
    it('should have display info for all 6 tools', () => {
      expect(Object.keys(TOOL_DISPLAY_INFO)).toHaveLength(6);
    });

    it('should have correct structure for each tool', () => {
      Object.values(TOOL_DISPLAY_INFO).forEach((info) => {
        expect(info).toHaveProperty('icon');
        expect(info).toHaveProperty('label');
        expect(info).toHaveProperty('description');
        expect(info).toHaveProperty('color');
        expect(typeof info.icon).toBe('string');
        expect(typeof info.label).toBe('string');
        expect(typeof info.description).toBe('string');
        expect(typeof info.color).toBe('string');
      });
    });

    it('should have display info for pdf_maker', () => {
      const info = TOOL_DISPLAY_INFO.pdf_maker;
      expect(info.icon).toBe('📄');
      expect(info.label).toBe('PDF Maker');
      expect(info.description).toBe('Create professional PDF documents');
      expect(info.color).toBe('#EF4444');
    });

    it('should have unique colors for each tool', () => {
      const colors = Object.values(TOOL_DISPLAY_INFO).map((info) => info.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });

    it('should have unique labels for each tool', () => {
      const labels = Object.values(TOOL_DISPLAY_INFO).map((info) => info.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });
  });

  describe('Tool parameter validation', () => {
    it('should have valid parameter types', () => {
      const tools = getAllDocumentTools();
      tools.forEach((tool) => {
        Object.values(tool.parameters).forEach((param: any) => {
          expect(['string', 'array', 'object', 'number', 'boolean']).toContain(param.type);
        });
      });
    });

    it('should have descriptions for all parameters', () => {
      const tools = getAllDocumentTools();
      tools.forEach((tool) => {
        Object.values(tool.parameters).forEach((param: any) => {
          expect(param.description).toBeDefined();
          expect(typeof param.description).toBe('string');
          expect(param.description.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string in getToolByName', () => {
      const tool = getToolByName('');
      expect(tool).toBeUndefined();
    });

    it('should handle case-sensitive tool names', () => {
      const tool1 = getToolByName('PDF_MAKER');
      const tool2 = getToolByName('Pdf_Maker');
      expect(tool1).toBeUndefined();
      expect(tool2).toBeUndefined();
    });

    it('should handle special characters in getToolByName', () => {
      const tool = getToolByName('pdf_maker!@#');
      expect(tool).toBeUndefined();
    });
  });
});
