/**
 * AWS S3 Upload Utility
 * 
 * Handles uploading generated files to S3 and returning public URLs
 */

import { PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const S3_BASE_URL = process.env.AWS_S3_BASE_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

/**
 * Upload file buffer to S3 and return public URL
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'documents'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate environment variables
    if (!BUCKET_NAME) {
      return { success: false, error: 'AWS S3 bucket name not configured' };
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return { success: false, error: 'AWS credentials not configured' };
    }

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${timestamp}_${sanitizedFileName}`;

    // Upload parameters
    const uploadParams: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Make file publicly accessible
      CacheControl: 'max-age=31536000', // Cache for 1 year
    };

    // Upload to S3
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct public URL
    const publicUrl = `${S3_BASE_URL}/${key}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown S3 upload error',
    };
  }
}

/**
 * Upload PDF to S3
 */
export async function uploadPDFToS3(
  pdfBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const fileNameWithExt = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  return uploadToS3(pdfBuffer, fileNameWithExt, 'application/pdf', 'documents/pdfs');
}

/**
 * Upload Word document to S3
 */
export async function uploadDocxToS3(
  docxBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const fileNameWithExt = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
  return uploadToS3(
    docxBuffer,
    fileNameWithExt,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'documents/docx'
  );
}

/**
 * Upload Excel spreadsheet to S3
 */
export async function uploadExcelToS3(
  excelBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const fileNameWithExt = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  return uploadToS3(
    excelBuffer,
    fileNameWithExt,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'documents/excel'
  );
}

/**
 * Upload CSV file to S3
 */
export async function uploadCSVToS3(
  csvBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const fileNameWithExt = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  return uploadToS3(csvBuffer, fileNameWithExt, 'text/csv', 'documents/csv');
}

/**
 * Upload text file to S3
 */
export async function uploadTextToS3(
  textBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const fileNameWithExt = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
  return uploadToS3(textBuffer, fileNameWithExt, 'text/plain', 'documents/text');
}

/**
 * Get content type from file extension
 */
export function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
  };

  return contentTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Validate S3 configuration
 */
export function isS3Configured(): { configured: boolean; missing: string[] } {
  const required = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    configured: missing.length === 0,
    missing,
  };
}

/**
 * Get S3 configuration status
 */
export function getS3Status(): {
  configured: boolean;
  region?: string;
  bucket?: string;
  error?: string;
} {
  const { configured, missing } = isS3Configured();

  if (!configured) {
    return {
      configured: false,
      error: `Missing environment variables: ${missing.join(', ')}`,
    };
  }

  return {
    configured: true,
    region: process.env.AWS_REGION,
    bucket: BUCKET_NAME,
  };
}
