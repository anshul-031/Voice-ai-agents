# Document Tools Usage Guide

Complete guide for using the Document & File Tools feature in your AI voice agents.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Enabling Tools](#enabling-tools)
3. [Using Tools via API](#using-tools-via-api)
4. [Using Tools with LLM](#using-tools-with-llm)
5. [Tool Examples](#tool-examples)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- AWS S3 configured (see DOCUMENT_TOOLS_SETUP.md)
- Agent created in the dashboard
- Tools enabled for your agent

### 30-Second Test
```bash
# 1. Enable a tool in dashboard (e.g., PDF Maker)
# 2. Test via API:
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "YOUR_AGENT_ID",
    "toolName": "pdf_maker",
    "parameters": {
      "title": "Test Report",
      "content": [
        {"type": "heading", "text": "Hello World", "level": 1},
        {"type": "paragraph", "text": "This is a test PDF."}
      ]
    }
  }'
```

---

## Enabling Tools

### Method 1: Via Dashboard UI

1. **Navigate to Agents Page**
   - Go to `/dashboard/agents` in your browser
   - Click "Edit" on any agent

2. **Find Document & File Tools Section**
   - Scroll down to "Document & File Tools"
   - You'll see 6 available tools with toggle switches

3. **Enable Desired Tools**
   - Click the toggle switch for each tool you want to enable
   - Tools turn green when enabled
   - Counter badge shows number of enabled tools

4. **Save Agent**
   - Click "Save Agent" button
   - Enabled tools are now active for this agent

### Method 2: Via API

```javascript
// Update agent with enabled tools
const response = await fetch('/api/agents/update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'your-agent-id',
    enabledTools: [
      { toolName: 'pdf_maker', enabled: true },
      { toolName: 'word_creator', enabled: true },
      { toolName: 'spreadsheet_creator', enabled: true }
    ]
  })
});
```

---

## Using Tools via API

### Direct Tool Execution

#### Endpoint
```
POST /api/tools/execute
```

#### Request Format
```json
{
  "agentId": "string (required)",
  "toolName": "string (required)",
  "parameters": {
    // Tool-specific parameters
  }
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://your-bucket.s3.amazonaws.com/documents/pdfs/2024-10-24_report.pdf",
    "metadata": {
      "pages": 1,
      "size": "A4"
    }
  }
}
```

---

## Using Tools with LLM

### How It Works

1. **User makes request to agent**
   ```
   "Create a sales report PDF for Q4 2024"
   ```

2. **LLM detects tool need**
   - Gemini 2.0 Flash analyzes request
   - Identifies `pdf_maker` tool is needed
   - Generates function call with parameters

3. **System executes tool**
   - Validates agent has tool enabled
   - Executes PDF maker
   - Uploads to S3
   - Returns public URL

4. **LLM responds to user**
   ```
   "I've created your Q4 2024 sales report. You can download it here: [PDF link]"
   ```

### Example Conversation

```javascript
// POST /api/llm
{
  "agentId": "agent_123",
  "messages": [
    {
      "role": "user",
      "content": "Create a PDF document with the title 'Project Proposal' and add a heading 'Introduction' followed by a paragraph explaining the project."
    }
  ]
}

// Response
{
  "response": "I've created a PDF document with your project proposal. Here's the link: https://your-bucket.s3.amazonaws.com/documents/pdfs/2024-10-24_project_proposal.pdf",
  "usedTools": true,
  "toolResults": [
    {
      "toolName": "pdf_maker",
      "success": true,
      "fileUrl": "https://your-bucket.s3.amazonaws.com/documents/pdfs/2024-10-24_project_proposal.pdf"
    }
  ]
}
```

---

## Tool Examples

### 1. PDF Maker

#### Create Simple PDF
```bash
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_123",
    "toolName": "pdf_maker",
    "parameters": {
      "title": "Weekly Report",
      "fileName": "weekly-report",
      "content": [
        {
          "type": "heading",
          "text": "Sales Summary",
          "level": 1
        },
        {
          "type": "paragraph",
          "text": "This week we achieved record sales of $50,000."
        },
        {
          "type": "table",
          "headers": ["Product", "Sales", "Growth"],
          "rows": [
            ["Widget A", "$20,000", "+15%"],
            ["Widget B", "$30,000", "+25%"]
          ]
        }
      ]
    }
  }'
```

#### Advanced PDF with Multiple Sections
```javascript
{
  "title": "Quarterly Business Report",
  "fileName": "q4-2024-report",
  "metadata": {
    "author": "Sales Team",
    "subject": "Q4 2024 Performance"
  },
  "content": [
    {"type": "heading", "text": "Executive Summary", "level": 1},
    {"type": "paragraph", "text": "Q4 exceeded all targets..."},
    {"type": "spacer", "height": 2},
    {"type": "line"},
    {"type": "heading", "text": "Detailed Analysis", "level": 2},
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Revenue up 25% YoY",
        "Customer acquisition increased 40%",
        "Profit margins improved 5%"
      ]
    }
  ]
}
```

---

### 2. Word Creator

#### Create Business Document
```bash
curl -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_123",
    "toolName": "word_creator",
    "parameters": {
      "title": "Meeting Minutes",
      "fileName": "team-meeting-2024-10-24",
      "sections": [
        {
          "heading": "Attendees",
          "content": "John Doe, Jane Smith, Bob Johnson",
          "style": "normal"
        },
        {
          "heading": "Agenda Items",
          "content": "1. Q4 Review\n2. Budget Planning\n3. Next Steps",
          "style": "normal"
        },
        {
          "heading": "Action Items",
          "content": "- John: Prepare budget\n- Jane: Schedule follow-up\n- Bob: Send updates",
          "style": "normal"
        }
      ]
    }
  }'
```

---

### 3. Spreadsheet Creator

#### Create Sales Data Spreadsheet
```javascript
{
  "agentId": "agent_123",
  "toolName": "spreadsheet_creator",
  "parameters": {
    "fileName": "sales-data-oct-2024",
    "sheets": [
      {
        "name": "Monthly Sales",
        "data": [
          ["Month", "Revenue", "Expenses", "Profit"],
          ["January", 50000, 30000, 20000],
          ["February", 55000, 32000, 23000],
          ["March", 60000, 35000, 25000]
        ]
      },
      {
        "name": "Product Breakdown",
        "data": [
          ["Product", "Units Sold", "Price", "Total"],
          ["Widget A", 100, 500, 50000],
          ["Widget B", 150, 400, 60000]
        ]
      }
    ]
  }
}
```

---

### 4. File Reader

#### Read PDF Document
```javascript
{
  "agentId": "agent_123",
  "toolName": "file_reader",
  "parameters": {
    "fileUrl": "https://example.com/document.pdf",
    "fileType": "pdf",
    "extractOptions": {}
  }
}

// Response
{
  "success": true,
  "data": {
    "content": "Full text extracted from PDF...",
    "metadata": {
      "pages": 5,
      "title": "Document Title"
    }
  }
}
```

#### Read Excel Spreadsheet
```javascript
{
  "agentId": "agent_123",
  "toolName": "file_reader",
  "parameters": {
    "fileUrl": "https://example.com/data.xlsx",
    "fileType": "xlsx"
  }
}
```

---

### 5. Document Summarizer

#### Summarize PDF Document
```javascript
{
  "agentId": "agent_123",
  "toolName": "document_summarizer",
  "parameters": {
    "fileUrl": "https://example.com/long-report.pdf",
    "fileType": "pdf",
    "summaryLength": "brief",  // brief, medium, or detailed
    "format": "bulletPoints",   // text, bulletPoints, pdf, or docx
    "includeKeywords": true
  }
}

// Response
{
  "success": true,
  "data": {
    "summary": "• Main point 1\n• Main point 2\n• Key finding 3",
    "keywords": ["revenue", "growth", "strategy"],
    "metadata": {
      "originalLength": 5000,
      "summaryLength": 200
    }
  }
}
```

---

### 6. PDF Editor

#### Merge Multiple PDFs
```javascript
{
  "agentId": "agent_123",
  "toolName": "pdf_editor",
  "parameters": {
    "operation": "merge",
    "inputFiles": [
      "https://example.com/part1.pdf",
      "https://example.com/part2.pdf",
      "https://example.com/part3.pdf"
    ],
    "outputFileName": "combined-document"
  }
}
```

#### Split PDF
```javascript
{
  "agentId": "agent_123",
  "toolName": "pdf_editor",
  "parameters": {
    "operation": "split",
    "inputFiles": ["https://example.com/large-document.pdf"],
    "splitOptions": {
      "pageRanges": [
        {"start": 1, "end": 5},
        {"start": 6, "end": 10}
      ]
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Tool Not Working
```json
// Error: Tool is not enabled for this agent
{
  "error": "Tool 'pdf_maker' is not enabled for this agent"
}
```

**Solution:**
- Go to agent edit page in dashboard
- Enable the tool via toggle switch
- Save the agent

---

#### 2. AWS S3 Not Configured
```json
// Error: AWS S3 is not configured
{
  "error": "AWS S3 bucket name not configured"
}
```

**Solution:**
Add to `.env.local`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_BASE_URL=https://your_bucket.s3.amazonaws.com
```

---

#### 3. Permission Denied
```json
// Error: Access Denied to S3 bucket
{
  "error": "S3 upload error: Access Denied"
}
```

**Solution:**
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure IAM role has `s3:PutObject` and `s3:PutObjectAcl` permissions

---

#### 4. File Not Accessible
```json
// Error: Cannot read file from URL
{
  "error": "Failed to download file from URL"
}
```

**Solution:**
- Verify file URL is accessible (not behind auth)
- Check file URL format is correct
- Ensure file type matches specified fileType parameter

---

## Testing Checklist

### Before Going to Production

- [ ] AWS S3 credentials configured
- [ ] Test each tool individually via API
- [ ] Enable tools for test agent
- [ ] Test LLM integration with agent
- [ ] Verify file uploads to S3 successfully
- [ ] Check public URLs are accessible
- [ ] Test error handling (invalid parameters, missing files, etc.)
- [ ] Verify permission system (tool enabled/disabled)

---

## API Reference Summary

### POST /api/tools/execute
**Execute a specific tool**

Request:
- `agentId`: string (required)
- `toolName`: string (required)
- `parameters`: object (tool-specific)

Response:
- `success`: boolean
- `data`: object (fileUrl, metadata)
- `error`: string (if failed)

---

### GET /api/tools/execute?agentId=xxx
**List enabled tools for an agent**

Response:
```json
{
  "tools": [
    {
      "name": "pdf_maker",
      "enabled": true,
      "description": "Create professional PDF documents"
    }
  ]
}
```

---

### POST /api/llm
**Chat with agent (with tools support)**

Request:
- `agentId`: string (required)
- `messages`: array of message objects

Response:
- `response`: string (LLM response)
- `usedTools`: boolean
- `toolResults`: array (if tools were used)

---

## Next Steps

1. **Start Simple**: Begin with PDF Maker for basic reports
2. **Expand Gradually**: Add more tools as needed
3. **Monitor Usage**: Check S3 bucket for generated files
4. **Optimize**: Adjust tool parameters based on user feedback
5. **Scale**: Enable tools for more agents as confidence grows

---

## Additional Resources

- **Setup Guide**: `DOCUMENT_TOOLS_SETUP.md`
- **System Overview**: `README_DOCUMENT_TOOLS.md`
- **Visual Examples**: `DOCUMENT_TOOLS_EXAMPLES.md`
- **Quick Reference**: `QUICK_START_TOOLS.md`

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review error messages in console
3. Verify AWS S3 configuration
4. Test tools individually via API
5. Check agent has tools enabled

**Remember:** Tools only work if:
- ✅ AWS S3 is configured
- ✅ Tool is enabled for the agent
- ✅ Valid parameters are provided
- ✅ Agent ID is correct

Happy automating! 🚀
