# 🚀 Quick Start - Document Tools (5 Minutes)

Get your document tools running in just 5 minutes!

---

## ⚡ Step 1: Install Dependencies (2 minutes)

```bash
npm install pdfkit docx xlsx pdf-parse mammoth axios @aws-sdk/client-s3
```

---

## 🔐 Step 2: Configure AWS S3 (2 minutes)

### Option A: Use Existing S3 Bucket (Fastest)

Add to `.env.local`:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_BASE_URL=https://your_bucket_name.s3.amazonaws.com
```

### Option B: Create New Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Name: `my-app-documents`
4. **Uncheck** "Block all public access"
5. Create bucket
6. Go to Permissions → Bucket Policy → Paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-app-documents/*"
  }]
}
```

7. Get AWS credentials from IAM console
8. Add to `.env.local` (see Option A)

---

## ✅ Step 3: Test (1 minute)

### Start Server

```bash
npm run dev
```

### Test API

```bash
curl -X GET http://localhost:3000/api/tools/execute
```

**Expected:**
```json
{
  "success": true,
  "tools": [...],
  "s3Status": {
    "configured": true,
    "region": "us-east-1",
    "bucket": "my-app-documents"
  }
}
```

✅ If `configured: true` → **You're ready!**

❌ If `configured: false` → Check `.env.local` variables

---

## 🎯 Step 4: Enable Tool for Agent (30 seconds)

1. Open http://localhost:3000/dashboard
2. Click "Edit" on any agent
3. Scroll to "Document & File Tools"
4. Toggle **PDF Maker** ON (should turn green)
5. Click "Save Changes"

---

## 🧪 Step 5: Test with Your Agent (30 seconds)

### Get Agent ID

```bash
curl http://localhost:3000/api/voice-agents | jq '.[0]._id'
```

Copy the agent ID (e.g., `670f1234abcd5678ef901234`)

### Test PDF Generation

```bash
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "YOUR_AGENT_ID_HERE",
    "toolName": "pdf_maker",
    "parameters": {
      "title": "Test Invoice",
      "content": [
        {"type": "heading", "text": "INVOICE", "level": 1},
        {"type": "paragraph", "text": "This is a test invoice."}
      ]
    }
  }'
```

**Expected:**
```json
{
  "success": true,
  "result": {
    "fileUrl": "https://my-app-documents.s3.amazonaws.com/documents/pdfs/..."
  }
}
```

**Copy the URL and open in browser → See your PDF! 📄**

---

## 🎉 Success! What's Next?

### Test with LLM

Send a message to your agent:
```
"Create a PDF invoice for $1000"
```

Agent should automatically:
1. Detect need for PDF
2. Generate invoice
3. Return download link

### Enable More Tools

Go back to agent edit modal and enable:
- ✅ **Word Creator** - Generate DOCX files
- ✅ **Spreadsheet Creator** - Create Excel files
- ✅ **File Reader** - Read uploaded documents
- ✅ **Document Summarizer** - Summarize PDFs

---

## 🐛 Troubleshooting

### "Cannot find module 'pdfkit'"

```bash
npm install pdfkit docx xlsx pdf-parse mammoth axios @aws-sdk/client-s3
```

### "AWS credentials not configured"

Check `.env.local` has:
- AWS_REGION
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_BUCKET_NAME

Restart server: `npm run dev`

### "Tool not enabled for this agent"

Go to Dashboard → Edit Agent → Enable tool → Save

### S3 upload fails

1. Check bucket policy allows public read
2. Verify IAM user has S3 write permissions
3. Try uploading manually to S3 console first

---

## 📚 Full Documentation

- **Complete Setup:** `DOCUMENT_TOOLS_SETUP.md`
- **System Overview:** `README_DOCUMENT_TOOLS.md`
- **Examples:** `DOCUMENT_TOOLS_EXAMPLES.md`

---

## 🎯 Quick Test Commands

### Check S3 Status
```bash
curl http://localhost:3000/api/tools/execute | jq '.s3Status'
```

### List All Tools
```bash
curl http://localhost:3000/api/tools/execute | jq '.tools[].name'
```

### Get Agent Tools
```bash
curl "http://localhost:3000/api/tools/execute?agentId=YOUR_AGENT_ID" | jq
```

### Test Each Tool

**PDF Maker:**
```bash
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT_ID","toolName":"pdf_maker","parameters":{"title":"Test","content":[{"type":"heading","text":"Hello","level":1}]}}'
```

**Word Creator:**
```bash
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT_ID","toolName":"word_creator","parameters":{"title":"Test","sections":[{"type":"title","text":"Hello World"}]}}'
```

**Spreadsheet Creator:**
```bash
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT_ID","toolName":"spreadsheet_creator","parameters":{"fileName":"test","sheets":[{"name":"Sheet1","headers":["A","B"],"data":[["1","2"]]}]}}'
```

---

## ⏱️ Time Breakdown

- ✅ **Step 1** (Install): 2 min
- ✅ **Step 2** (AWS Setup): 2 min
- ✅ **Step 3** (Test): 1 min
- ✅ **Step 4** (Enable Tool): 30 sec
- ✅ **Step 5** (Test PDF): 30 sec

**Total:** ~5 minutes ⚡

---

**Your document tools are ready! Start creating PDFs, Word docs, and spreadsheets with your AI agents! 🚀**
