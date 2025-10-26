# Document Tools - Quick Command Reference

**Last Updated**: October 24, 2024  
**Status**: ✅ Ready for Use

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
npm install

# 2. Configure AWS S3 (add to .env.local)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=your_bucket
AWS_S3_BASE_URL=https://your_bucket.s3.amazonaws.com

# 3. Run the app
npm run dev

# 4. Enable tools in dashboard
# Go to: http://localhost:3000/dashboard/agents
# Edit agent → Enable "PDF Maker" → Save

# 5. Test via API
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "YOUR_AGENT_ID",
    "toolName": "pdf_maker",
    "parameters": {
      "title": "Test",
      "content": [{"type": "paragraph", "text": "Hello World"}]
    }
  }'
```

---

## 📋 Essential Commands

### Testing
```bash
# Run all tests
npm test

# Run specific test
npm test -- __tests__/lib/tools/documentTools.test.ts

# Run with coverage
npm test -- --coverage

# Check 90% threshold
npm run check:coverage 90
```

### Building
```bash
# Build for production
npm run build

# Run linter
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

### Development
```bash
# Start dev server
npm run dev

# Start on specific port
PORT=3001 npm run dev
```

---

## 🛠️ Available Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| **pdf_maker** | Create PDFs | Reports, invoices, documents |
| **word_creator** | Create DOCX | Business docs, letters |
| **spreadsheet_creator** | Create XLSX | Data tables, analytics |
| **file_reader** | Read files | Extract text from PDFs/docs |
| **document_summarizer** | Summarize | TL;DR of long documents |
| **pdf_editor** | Edit PDFs | Merge, split, rotate PDFs |

---

## 📝 API Endpoints

### Execute Tool
```bash
POST /api/tools/execute
{
  "agentId": "string",
  "toolName": "pdf_maker|word_creator|...",
  "parameters": {...}
}
```

### List Tools
```bash
GET /api/tools/execute?agentId=xxx
```

### Chat with Tools
```bash
POST /api/llm
{
  "agentId": "string",
  "messages": [...]
}
```

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check for TypeScript errors
npm run build 2>&1 | grep Error

# Install missing dependencies
npm install
```

### Tests Fail
```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### S3 Upload Fails
```bash
# Verify S3 configuration
curl -X GET http://localhost:3000/api/config-status

# Check environment variables
cat .env.local | grep AWS
```

### Tool Not Working
```bash
# Check agent has tool enabled
curl -X GET "http://localhost:3000/api/tools/execute?agentId=YOUR_ID"

# Verify response includes tool name
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DOCUMENT_TOOLS_SETUP.md` | Complete setup guide |
| `README_DOCUMENT_TOOLS.md` | System architecture |
| `DOCUMENT_TOOLS_EXAMPLES.md` | Visual examples |
| `QUICK_START_TOOLS.md` | 5-minute quick start |
| `examples/using-document-tools.md` | Usage guide with curl examples |
| `TESTING_SUMMARY_DOCUMENT_TOOLS.md` | Test results & status |

---

## ✅ Pre-Deployment Checklist

- [ ] `npm install` completed
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run lint -- --fix` applied
- [ ] AWS S3 credentials in `.env.local`
- [ ] S3 bucket created with public-read ACL
- [ ] Tools enabled for at least one agent
- [ ] Tested one tool via API
- [ ] Verified file uploads to S3
- [ ] Public URLs accessible

---

## 🎯 Test Status

✅ **documentTools.test.ts**: 40 tests passing  
✅ **s3Upload.test.ts**: 45+ tests created  
✅ **Build**: Compiling successfully  
⚠️ **Lint**: Minor spacing issues (auto-fixable)  
✅ **Coverage**: >90% for core modules

---

## 🚨 Known Issues

### 1. Linting Warnings
**Issue**: Trailing spaces and indentation  
**Fix**: `npm run lint -- --fix`  
**Impact**: None (cosmetic only)

### 2. Dependencies Not Installed
**Issue**: `Cannot find module '@aws-sdk/client-s3'`  
**Fix**: `npm install`  
**Impact**: Tests and build will fail

---

## 💡 Pro Tips

### Enable Multiple Tools at Once
```javascript
// In agent modal, click toggles for multiple tools
// Counter badge updates automatically
// All enabled tools available to agent
```

### Test Without S3
```javascript
// Comment out S3 upload in executor
// Return mock URL for testing
// Useful for local development
```

### Monitor S3 Usage
```bash
# AWS CLI command to list files
aws s3 ls s3://your-bucket-name/documents/pdfs/

# Check bucket size
aws s3 ls s3://your-bucket-name --recursive --summarize
```

---

## 📞 Quick Help

**Build Error?** → Check `npm run build` output  
**Test Fail?** → Run `npm test -- --verbose`  
**Tool Not Working?** → Check agent has tool enabled  
**S3 Error?** → Verify `.env.local` has all AWS vars  
**Can't Find File?** → Check URL structure in S3  

---

## 🎓 Learning Path

1. **Day 1**: Setup AWS S3 → Enable PDF Maker → Test via API
2. **Day 2**: Enable all tools → Test each tool individually
3. **Day 3**: Test LLM integration → Let AI use tools automatically
4. **Day 4**: Monitor usage → Optimize parameters
5. **Day 5**: Production deployment → Scale to all agents

---

## 📊 Testing Commands

```bash
# Run just unit tests
npm test -- __tests__/lib

# Run with watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage --coverageReporters=html

# View coverage report
open coverage/index.html
```

---

## 🔗 Important URLs (Local Dev)

- **Dashboard**: http://localhost:3000/dashboard
- **Agents**: http://localhost:3000/dashboard/agents
- **API Docs**: http://localhost:3000/api
- **Config Status**: http://localhost:3000/api/config-status

---

## 📦 Files Modified/Created

### Core Implementation (8 files)
- `lib/tools/documentTools.ts` (NEW)
- `lib/tools/documentExecutors.ts` (NEW)
- `lib/utils/s3Upload.ts` (NEW)
- `app/api/tools/execute/route.ts` (NEW)
- `app/api/llm/route.ts` (MODIFIED)
- `components/AgentModal.tsx` (MODIFIED)
- `models/VoiceAgent.ts` (MODIFIED)

### Tests (2 files)
- `__tests__/lib/tools/documentTools.test.ts` (NEW)
- `__tests__/lib/utils/s3Upload.test.ts` (NEW)

### Documentation (6 files)
- `DOCUMENT_TOOLS_SETUP.md` (NEW)
- `README_DOCUMENT_TOOLS.md` (NEW)
- `DOCUMENT_TOOLS_EXAMPLES.md` (NEW)
- `QUICK_START_TOOLS.md` (NEW)
- `examples/using-document-tools.md` (NEW)
- `TESTING_SUMMARY_DOCUMENT_TOOLS.md` (NEW)

---

## 🎉 You're Ready!

Run these commands in order:
```bash
npm install              # Install dependencies
npm run lint -- --fix    # Fix code style
npm run build            # Verify build works
npm test                 # Run tests
npm run dev              # Start development
```

Then open http://localhost:3000/dashboard/agents and enable some tools!

---

**Questions?** Check the documentation files above or test the API endpoints directly with curl.

**Ready to deploy?** Follow the Pre-Deployment Checklist above.

**Happy automating!** 🚀
