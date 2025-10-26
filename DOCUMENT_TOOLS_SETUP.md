# Document Tools - Installation & Configuration Guide

## 📦 Step 1: Install Required NPM Packages

Run the following command to install all required dependencies:

```bash
npm install pdfkit docx xlsx pdf-parse mammoth axios @aws-sdk/client-s3
```

### Package Details:

- **pdfkit** - PDF generation library
- **docx** - Microsoft Word document (.docx) generation
- **xlsx** - Excel spreadsheet creation and parsing
- **pdf-parse** - PDF file reading and text extraction
- **mammoth** - DOCX file reading
- **axios** - HTTP client for downloading files
- **@aws-sdk/client-s3** - AWS S3 upload functionality

### Install TypeScript Types (Dev Dependencies):

```bash
npm install -D @types/pdfkit @types/pdf-parse
```

---

## ⚙️ Step 2: Configure AWS S3

### 2.1 Create AWS S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. **Bucket name**: `your-app-documents` (or any unique name)
4. **Region**: Choose your preferred region (e.g., `us-east-1`)
5. **Block Public Access**: Uncheck "Block all public access" (we need public URLs)
6. ✅ Acknowledge the warning
7. Click "Create bucket"

### 2.2 Configure Bucket for Public Access

1. Go to your bucket → **Permissions** tab
2. Scroll to **Bucket Policy** → Click "Edit"
3. Paste this policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

4. Click "Save changes"

### 2.3 Get AWS Credentials

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Add user**
3. User name: `document-tools-uploader`
4. Select **Programmatic access**
5. Permissions: Attach policy **AmazonS3FullAccess** (or create custom policy)
6. Complete creation
7. **Save Access Key ID and Secret Access Key** (shown only once!)

---

## 🔐 Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# AWS S3 Configuration for Document Tools
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET_NAME=your-app-documents
AWS_S3_BASE_URL=https://your-app-documents.s3.amazonaws.com
```

### Variable Explanations:

- **AWS_REGION**: Your S3 bucket region
- **AWS_ACCESS_KEY_ID**: From Step 2.3
- **AWS_SECRET_ACCESS_KEY**: From Step 2.3
- **AWS_S3_BUCKET_NAME**: Your bucket name from Step 2.1
- **AWS_S3_BASE_URL**: Auto-constructed as `https://{BUCKET_NAME}.s3.amazonaws.com`

---

## ✅ Step 4: Verify Installation

### 4.1 Check S3 Configuration

Create a test script `test-s3.js`:

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3() {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'test/test-file.txt',
      Body: 'Hello from document tools!',
      ACL: 'public-read',
    });
    
    await s3Client.send(command);
    console.log('✅ S3 Upload successful!');
    console.log(`URL: ${process.env.AWS_S3_BASE_URL}/test/test-file.txt`);
  } catch (error) {
    console.error('❌ S3 Upload failed:', error.message);
  }
}

testS3();
```

Run: `node test-s3.js`

### 4.2 Start Development Server

```bash
npm run dev
```

---

## 🎯 Step 5: Test Document Tools

### Test 1: Generate PDF via API

```bash
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "YOUR_AGENT_ID",
    "toolName": "pdf_maker",
    "parameters": {
      "title": "Test Invoice",
      "fileName": "test_invoice",
      "content": [
        {"type": "heading", "text": "Invoice", "level": 1},
        {"type": "paragraph", "text": "This is a test invoice document."},
        {"type": "table", "headers": ["Item", "Quantity", "Price"], "rows": [["Product A", "2", "$100"], ["Product B", "1", "$50"]]}
      ],
      "metadata": {"author": "Test Agent"}
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "tool": "pdf_maker",
  "result": {
    "fileUrl": "https://your-bucket.s3.amazonaws.com/documents/pdfs/2025-10-23_test_invoice.pdf",
    "data": {
      "fileName": "test_invoice.pdf",
      "fileSize": 12345,
      "pageCount": 1
    }
  }
}
```

### Test 2: Enable Tool for Agent

1. Go to **Dashboard** → **Voice Agents**
2. Click "Edit" on any agent
3. Scroll to **Document & File Tools** section
4. Toggle "PDF Maker" ON
5. Click "Save Changes"

### Test 3: Test with LLM

1. Open your voice agent chat
2. Send message: "Create a PDF invoice for John Doe with 2 items"
3. LLM should automatically:
   - Detect need for PDF creation
   - Call `pdf_maker` tool
   - Generate PDF
   - Return link in response

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'pdfkit'"

**Solution:** Run `npm install pdfkit docx xlsx pdf-parse mammoth axios @aws-sdk/client-s3`

### Error: "AWS credentials not configured"

**Solution:** Check `.env.local` has all AWS variables set correctly

### Error: "S3 upload failed - Access Denied"

**Solutions:**
1. Verify AWS credentials are correct
2. Check IAM user has S3 permissions
3. Verify bucket policy allows uploads

### Error: "Bucket does not exist"

**Solution:** Check `AWS_S3_BUCKET_NAME` matches your actual bucket name

### Tool enabled but LLM not using it

**Solutions:**
1. Ensure `agentId` is passed to `/api/llm` endpoint
2. Check agent has tool enabled in database
3. Verify Gemini 2.0 Flash model is being used
4. Check console logs for function calling detection

### Generated files not accessible

**Solutions:**
1. Check bucket policy allows public read access
2. Verify ACL is set to 'public-read' in upload
3. Try accessing file directly via S3 URL

---

## 📊 Tool Usage Examples

### Example 1: PDF Invoice

```javascript
{
  "toolName": "pdf_maker",
  "parameters": {
    "title": "Invoice #1234",
    "fileName": "invoice_1234_oct_2025",
    "content": [
      {"type": "heading", "text": "INVOICE", "level": 1},
      {"type": "paragraph", "text": "Invoice Date: October 23, 2025"},
      {"type": "paragraph", "text": "Customer: Acme Corp"},
      {"type": "spacer", "height": 10},
      {"type": "table", "headers": ["Item", "Qty", "Rate", "Amount"], "rows": [
        ["Consulting Services", "10", "$150", "$1,500"],
        ["Setup Fee", "1", "$500", "$500"]
      ]},
      {"type": "spacer", "height": 10},
      {"type": "paragraph", "text": "Total: $2,000"}
    ]
  }
}
```

### Example 2: Word Document

```javascript
{
  "toolName": "word_creator",
  "parameters": {
    "title": "Meeting Minutes",
    "fileName": "meeting_minutes_oct_23",
    "sections": [
      {"type": "title", "text": "Weekly Team Meeting"},
      {"type": "heading", "text": "Attendees", "level": 1},
      {"type": "bulletList", "items": ["John Doe", "Jane Smith", "Bob Wilson"]},
      {"type": "heading", "text": "Action Items", "level": 1},
      {"type": "numberedList", "items": ["Complete Q4 report", "Schedule client demo"]}
    ]
  }
}
```

### Example 3: Excel Spreadsheet

```javascript
{
  "toolName": "spreadsheet_creator",
  "parameters": {
    "fileName": "sales_data_oct_2025",
    "sheets": [
      {
        "name": "Sales",
        "headers": ["Date", "Product", "Units", "Revenue"],
        "data": [
          ["2025-10-01", "Product A", 50, 5000],
          ["2025-10-02", "Product B", 30, 3000]
        ]
      }
    ]
  }
}
```

---

## 🚀 Production Deployment

### Before Going to Production:

1. **Enable CORS** on S3 bucket if accessing from different domains
2. **Set up CloudFront CDN** for better file delivery performance
3. **Implement file size limits** in your tool executors
4. **Add rate limiting** to prevent abuse
5. **Set up S3 lifecycle policies** to auto-delete old files
6. **Monitor S3 costs** and set up billing alerts
7. **Enable S3 versioning** for file recovery
8. **Set up CloudWatch logs** for debugging

### S3 Lifecycle Policy (Optional):

Automatically delete files older than 90 days:

1. Go to bucket → **Management** tab
2. Click "Create lifecycle rule"
3. Rule name: "Auto-delete old documents"
4. Scope: Apply to all objects
5. Actions: Check "Expire current versions of objects"
6. Days after creation: 90
7. Create rule

---

## 📝 Summary Checklist

- [ ] Installed all NPM packages
- [ ] Created AWS S3 bucket
- [ ] Configured bucket for public access
- [ ] Created IAM user with S3 permissions
- [ ] Added AWS credentials to `.env.local`
- [ ] Tested S3 upload with test script
- [ ] Started development server
- [ ] Enabled tool for an agent in dashboard
- [ ] Tested PDF generation via API
- [ ] Tested LLM function calling
- [ ] Verified generated files are accessible

---

## 🆘 Need Help?

- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **pdfkit Docs**: https://pdfkit.org/
- **docx Docs**: https://docx.js.org/
- **Gemini Function Calling**: https://ai.google.dev/docs/function_calling

**Installation complete! Your agents can now create, read, and edit documents! 🎉**
