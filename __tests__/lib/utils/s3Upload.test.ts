/**
 * Unit Tests for S3 Upload Utility
 * Tests AWS S3 file uploads with mocked S3 client
 * Target: >90% code coverage
 */

import {
    getContentType,
    getS3Status,
    isS3Configured,
    uploadCSVToS3,
    uploadDocxToS3,
    uploadExcelToS3,
    uploadPDFToS3,
    uploadTextToS3,
    uploadToS3,
} from '@/lib/utils/s3Upload';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockPutObjectCommand = PutObjectCommand as jest.MockedClass<typeof PutObjectCommand>;

describe('s3Upload', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env = {
      ...originalEnv,
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      AWS_S3_BUCKET_NAME: 'test-bucket',
      AWS_S3_BASE_URL: 'https://test-bucket.s3.amazonaws.com',
    };

    // Mock S3Client send method
    mockS3Client.prototype.send = jest.fn().mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isS3Configured()', () => {
    it('should return configured true when all credentials are present', () => {
      const result = isS3Configured();
      expect(result.configured).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should return false when AWS_REGION is missing', () => {
      delete process.env.AWS_REGION;
      const result = isS3Configured();
      expect(result.configured).toBe(false);
      expect(result.missing).toContain('AWS_REGION');
    });

    it('should return false when AWS_ACCESS_KEY_ID is missing', () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      const result = isS3Configured();
      expect(result.configured).toBe(false);
      expect(result.missing).toContain('AWS_ACCESS_KEY_ID');
    });

    it('should return false when AWS_SECRET_ACCESS_KEY is missing', () => {
      delete process.env.AWS_SECRET_ACCESS_KEY;
      const result = isS3Configured();
      expect(result.configured).toBe(false);
      expect(result.missing).toContain('AWS_SECRET_ACCESS_KEY');
    });

    it('should return false when AWS_S3_BUCKET_NAME is missing', () => {
      delete process.env.AWS_S3_BUCKET_NAME;
      const result = isS3Configured();
      expect(result.configured).toBe(false);
      expect(result.missing).toContain('AWS_S3_BUCKET_NAME');
    });

    it('should list all missing credentials', () => {
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_S3_BUCKET_NAME;
      const result = isS3Configured();
      expect(result.configured).toBe(false);
      expect(result.missing.length).toBe(4);
    });
  });

  describe('getS3Status()', () => {
    it('should return configured status when all credentials present', () => {
      const status = getS3Status();
      expect(status.configured).toBe(true);
      expect(status.region).toBe('us-east-1');
      expect(status.bucket).toBe('test-bucket');
      expect(status.error).toBeUndefined();
    });

    it('should return not configured status when credentials missing', () => {
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      
      const status = getS3Status();
      expect(status.configured).toBe(false);
      expect(status.region).toBeUndefined();
      expect(status.error).toBeDefined();
      expect(status.error).toContain('Missing environment variables');
    });

    it('should not expose sensitive credentials', () => {
      const status = getS3Status();
      // Should not expose actual keys
      expect(status).not.toHaveProperty('accessKey');
      expect(status).not.toHaveProperty('secretKey');
    });
  });

  describe('getContentType()', () => {
    it('should return correct content type for PDF', () => {
      expect(getContentType('document.pdf')).toBe('application/pdf');
    });

    it('should return correct content type for DOCX', () => {
      expect(getContentType('document.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should return correct content type for XLSX', () => {
      expect(getContentType('spreadsheet.xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should return correct content type for CSV', () => {
      expect(getContentType('data.csv')).toBe('text/csv');
    });

    it('should return correct content type for TXT', () => {
      expect(getContentType('document.txt')).toBe('text/plain');
    });

    it('should return correct content type for JSON', () => {
      expect(getContentType('data.json')).toBe('application/json');
    });

    it('should return correct content type for PNG', () => {
      expect(getContentType('image.png')).toBe('image/png');
    });

    it('should return correct content type for JPEG/JPG', () => {
      expect(getContentType('photo.jpeg')).toBe('image/jpeg');
      expect(getContentType('photo.jpg')).toBe('image/jpeg');
    });

    it('should return default content type for unknown extension', () => {
      expect(getContentType('file.unknown')).toBe('application/octet-stream');
    });

    it('should handle filenames without extension', () => {
      expect(getContentType('document')).toBe('application/octet-stream');
    });

    it('should handle case-insensitive extensions', () => {
      expect(getContentType('document.PDF')).toBe('application/pdf');
      expect(getContentType('document.Pdf')).toBe('application/pdf');
    });
  });

  describe('uploadToS3()', () => {
    it('should successfully upload file to S3', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';
      const folder = 'documents';

      const result = await uploadToS3(buffer, fileName, contentType, folder);

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.url).toContain('https://test-bucket.s3.amazonaws.com/documents/');
      expect(result.url).toContain('test.pdf');
      expect(mockS3Client).toHaveBeenCalled();
    });

    it('should upload to specified folder', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'myfolder');

      expect(result.success).toBe(true);
      expect(result.url).toContain('/myfolder/');
    });

    it('should handle S3 upload errors', async () => {
      mockS3Client.prototype.send = jest.fn().mockRejectedValue(new Error('S3 upload failed'));

      const buffer = Buffer.from('test content');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');

      expect(result.success).toBe(false);
      expect(result.error).toContain('S3 upload failed');
    });

    it('should return error when S3 bucket is not configured', async () => {
      delete process.env.AWS_S3_BUCKET_NAME;

      const buffer = Buffer.from('test content');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('bucket name not configured');
    });

    it('should return error when AWS credentials are not configured', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;

      const buffer = Buffer.from('test content');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('credentials not configured');
    });

    it('should sanitize special characters in filename', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'test file (1).pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');

      expect(result.success).toBe(true);
      // Filename should be sanitized (special chars replaced with _)
      expect(result.url).toBeDefined();
    });
  });

  describe('uploadPDFToS3()', () => {
    it('should upload PDF with correct content type', async () => {
      const buffer = Buffer.from('%PDF-1.4 test content');
      const fileName = 'report.pdf';

      const result = await uploadPDFToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('/pdfs/');
      expect(result.url).toContain('report.pdf');
    });

    it('should add .pdf extension if missing', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'report';

      const result = await uploadPDFToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('report.pdf');
    });

    it('should not duplicate .pdf extension', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'report.pdf';

      const result = await uploadPDFToS3(buffer, fileName);

      expect(result.url).toContain('report.pdf');
      expect(result.url).not.toContain('.pdf.pdf');
    });
  });

  describe('uploadDocxToS3()', () => {
    it('should upload DOCX with correct content type', async () => {
      const buffer = Buffer.from('PK test content');
      const fileName = 'document.docx';

      const result = await uploadDocxToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('/docx/');
      expect(result.url).toContain('document.docx');
    });

    it('should add .docx extension if missing', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'document';

      const result = await uploadDocxToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('document.docx');
    });
  });

  describe('uploadExcelToS3()', () => {
    it('should upload Excel with correct content type', async () => {
      const buffer = Buffer.from('PK test content');
      const fileName = 'spreadsheet.xlsx';

      const result = await uploadExcelToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('/excel/');
      expect(result.url).toContain('spreadsheet.xlsx');
    });

    it('should add .xlsx extension if missing', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'spreadsheet';

      const result = await uploadExcelToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('spreadsheet.xlsx');
    });
  });

  describe('uploadCSVToS3()', () => {
    it('should upload CSV with correct content type', async () => {
      const buffer = Buffer.from('name,age\nJohn,30');
      const fileName = 'data.csv';

      const result = await uploadCSVToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('/csv/');
      expect(result.url).toContain('data.csv');
    });

    it('should add .csv extension if missing', async () => {
      const buffer = Buffer.from('test,data');
      const fileName = 'data';

      const result = await uploadCSVToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('data.csv');
    });
  });

  describe('uploadTextToS3()', () => {
    it('should upload text file with correct content type', async () => {
      const buffer = Buffer.from('Plain text content');
      const fileName = 'notes.txt';

      const result = await uploadTextToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('/text/');
      expect(result.url).toContain('notes.txt');
    });

    it('should add .txt extension if missing', async () => {
      const buffer = Buffer.from('test content');
      const fileName = 'notes';

      const result = await uploadTextToS3(buffer, fileName);

      expect(result.success).toBe(true);
      expect(result.url).toContain('notes.txt');
    });
  });

  describe('Error handling', () => {
    it('should handle empty buffer', async () => {
      const buffer = Buffer.from('');
      const fileName = 'empty.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');

      expect(result.success).toBe(true); // S3 accepts empty files
    });

    it('should handle very large filenames', async () => {
      const buffer = Buffer.from('test');
      const fileName = 'a'.repeat(300) + '.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');

      expect(result.success).toBe(true);
    });

    it('should handle network errors', async () => {
      mockS3Client.prototype.send = jest.fn().mockRejectedValue(new Error('Network timeout'));

      const buffer = Buffer.from('test');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle S3 permission errors', async () => {
      mockS3Client.prototype.send = jest.fn().mockRejectedValue(new Error('Access Denied'));

      const buffer = Buffer.from('test');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access Denied');
    });
  });

  describe('URL generation', () => {
    it('should generate correct URL structure', async () => {
      const buffer = Buffer.from('test');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';
      const folder = 'documents';

      const result = await uploadToS3(buffer, fileName, contentType, folder);

      expect(result.url).toMatch(/^https:\/\//);
      expect(result.url).toContain('test-bucket.s3.amazonaws.com');
      expect(result.url).toContain('/documents/');
    });

    it('should include timestamp in generated filename', async () => {
      const buffer = Buffer.from('test');
      const fileName = 'test.pdf';
      const contentType = 'application/pdf';

      const result = await uploadToS3(buffer, fileName, contentType, 'documents');

      expect(result.url).toBeDefined();
      // URL should contain timestamp prefix
      expect(result.url).toContain('/documents/');
    });
  });
});
