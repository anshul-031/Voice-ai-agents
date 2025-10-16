# 📄 PDF Generation Feature Guide

## Overview

The AI Voice Agent now supports **dynamic PDF generation** based on LLM responses. The LLM can create PDFs with structured content (headings, text, lists, tables) and send them directly in the chat for users to download.

## 🎯 Key Features

- ✅ **LLM-Driven**: PDF generation is controlled entirely by the system prompt
- ✅ **Structured Content**: Support for headings, paragraphs, lists, and tables
- ✅ **Automatic Download**: PDFs appear as downloadable attachments in chat
- ✅ **Multi-Page Support**: Automatically handles page breaks for long documents
- ✅ **Professional Formatting**: Clean layout with headers, footers, and page numbers

---

## 🔧 How It Works

### 1. System Prompt Configuration

In your agent's system prompt, instruct the LLM when and how to generate PDFs:

```
You are a financial advisor assistant. When a user requests a loan summary 
or payment schedule, generate a PDF document with the details.

To generate a PDF, respond with:
1. Your normal text response to the user
2. Followed by a PDF command in this exact format:

<<<PDF>>>
{
  "title": "Loan Payment Schedule",
  "fileName": "loan_schedule.pdf",
  "sections": [
    {
      "type": "heading",
      "content": "Your Loan Details",
      "level": 1
    },
    {
      "type": "text",
      "content": "Here is your personalized loan schedule..."
    },
    {
      "type": "list",
      "content": ["Item 1", "Item 2", "Item 3"]
    },
    {
      "type": "table",
      "content": [
        ["Month", "Payment", "Balance"],
        ["Jan", "$500", "$10,000"],
        ["Feb", "$500", "$9,500"]
      ]
    }
  ]
}
<<</PDF>>>
```

### 2. PDF Command Format

The PDF command must be enclosed in `<<<PDF>>>` and `<<</PDF>>>` tags and contain valid JSON:

**Required Fields:**
- `title` (string): Document title displayed on first page
- `sections` (array): Array of section objects

**Optional Fields:**
- `fileName` (string): Custom filename (default: auto-generated from title)

**Section Types:**

#### Heading
```json
{
  "type": "heading",
  "content": "Section Title",
  "level": 1  // 1, 2, or 3 (h1, h2, h3)
}
```

#### Text Paragraph
```json
{
  "type": "text",
  "content": "Regular paragraph text. This will be wrapped automatically to fit the page width."
}
```

#### Bulleted List
```json
{
  "type": "list",
  "content": [
    "First item",
    "Second item",
    "Third item with longer text that will wrap"
  ]
}
```

#### Table
```json
{
  "type": "table",
  "content": [
    ["Header 1", "Header 2", "Header 3"],  // First row is header
    ["Data 1", "Data 2", "Data 3"],
    ["Data 4", "Data 5", "Data 6"]
  ]
}
```

---

## 📝 Example System Prompts

### Example 1: Loan Summary Generator

```
You are a loan officer assistant for a bank. When users ask about their 
loan details, generate a professional PDF summary.

For loan inquiries, respond with:
1. A friendly message confirming the document is ready
2. A PDF with their loan details

Example response format:
"I've prepared your loan summary document. Please download it below."

<<<PDF>>>
{
  "title": "Loan Summary - [Customer Name]",
  "fileName": "loan_summary_[date].pdf",
  "sections": [
    {
      "type": "heading",
      "content": "Personal Loan Details",
      "level": 1
    },
    {
      "type": "text",
      "content": "Loan Amount: $15,000\nInterest Rate: 8.5%\nTenure: 24 months"
    },
    {
      "type": "heading",
      "content": "Payment Schedule",
      "level": 2
    },
    {
      "type": "table",
      "content": [
        ["Month", "EMI", "Principal", "Interest", "Balance"],
        ["Jan 2025", "$683", "$577", "$106", "$14,423"],
        ["Feb 2025", "$683", "$581", "$102", "$13,842"]
      ]
    }
  ]
}
<<</PDF>>>
```

### Example 2: Meeting Notes

```
You are an AI meeting assistant. When users request meeting notes,
create a structured PDF document.

When generating meeting notes:

<<<PDF>>>
{
  "title": "Meeting Notes - [Topic]",
  "sections": [
    {
      "type": "heading",
      "content": "Meeting Summary",
      "level": 1
    },
    {
      "type": "text",
      "content": "Date: [date]\nAttendees: [names]\nDuration: [time]"
    },
    {
      "type": "heading",
      "content": "Key Discussion Points",
      "level": 2
    },
    {
      "type": "list",
      "content": [
        "Point 1: Details...",
        "Point 2: Details...",
        "Point 3: Details..."
      ]
    },
    {
      "type": "heading",
      "content": "Action Items",
      "level": 2
    },
    {
      "type": "table",
      "content": [
        ["Task", "Owner", "Deadline"],
        ["Task 1", "John", "Jan 20"],
        ["Task 2", "Sarah", "Jan 25"]
      ]
    }
  ]
}
<<</PDF>>>
```

### Example 3: Invoice Generator

```
You are a billing assistant. Generate invoices as PDFs when requested.

<<<PDF>>>
{
  "title": "Invoice #INV-2025-001",
  "fileName": "invoice_001.pdf",
  "sections": [
    {
      "type": "heading",
      "content": "INVOICE",
      "level": 1
    },
    {
      "type": "text",
      "content": "Invoice Number: INV-2025-001\nDate: January 15, 2025\nDue Date: February 15, 2025"
    },
    {
      "type": "heading",
      "content": "Bill To",
      "level": 2
    },
    {
      "type": "text",
      "content": "[Customer Name]\n[Address]\n[City, State, ZIP]"
    },
    {
      "type": "heading",
      "content": "Items",
      "level": 2
    },
    {
      "type": "table",
      "content": [
        ["Description", "Quantity", "Rate", "Amount"],
        ["Service A", "1", "$500", "$500"],
        ["Service B", "2", "$300", "$600"],
        ["", "", "Total:", "$1,100"]
      ]
    }
  ]
}
<<</PDF>>>
```

---

## 🎨 PDF Styling

### Automatic Features

- **Page Size**: A4 (210mm × 297mm)
- **Margins**: 20mm on all sides
- **Font**: Helvetica (clean, professional)
- **Page Numbers**: Automatically added to footer ("Page X of Y")
- **Text Wrapping**: Long text automatically wraps to fit page width
- **Page Breaks**: Automatic when content exceeds page height

### Font Sizes

- **Title**: 20pt, bold
- **H1 Headings**: 16pt, bold
- **H2 Headings**: 14pt, bold
- **H3 Headings**: 12pt, bold
- **Body Text**: 11pt, normal
- **Lists**: 11pt with bullet points
- **Tables**: 10pt with borders

### Table Styling

- First row automatically styled as header (bold, gray background)
- All cells have borders
- Equal column widths
- Automatic row height

---

## 💻 Technical Implementation

### Files Modified/Created

1. **`app/api/generate-pdf/route.ts`** - PDF generation API endpoint
2. **`types/index.ts`** - Added `PDFAttachment` and `pdfCommand` types
3. **`app/api/llm/route.ts`** - PDF command extraction from LLM response
4. **`components/VoiceAIAgent.tsx`** - PDF generation handling
5. **`components/ChatBox.tsx`** - PDF download UI

### Dependencies

- **jsPDF**: Client-side PDF generation library

### API Endpoints

#### POST `/api/generate-pdf`

**Request:**
```json
{
  "title": "Document Title",
  "sections": [...],
  "fileName": "optional_custom_name.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "pdfData": "data:application/pdf;base64,JVBERi0xLjM...",
  "fileName": "document_title.pdf"
}
```

---

## 🧪 Testing

### Test the Feature

1. **Navigate to Agent Page**: `/agents/[id]/page`

2. **Update System Prompt** with PDF generation instructions (see examples above)

3. **Start Chat**: Use text or voice mode

4. **Trigger PDF Generation**: Ask for something that should create a PDF
   - "Can you create a loan summary?"
   - "Generate an invoice for my order"
   - "Send me meeting notes"

5. **Verify Download**: 
   - PDF attachment appears in chat
   - Click "Download" button
   - PDF opens with correct formatting

### Example Test Conversation

**User**: "Can you create a loan payment schedule for $10,000 at 8% for 12 months?"

**Agent Response**:
```
I've prepared your loan payment schedule. You can download the PDF document below.

<<<PDF>>>
{
  "title": "Loan Payment Schedule",
  "fileName": "loan_schedule_10k.pdf",
  "sections": [
    {
      "type": "heading",
      "content": "Loan Payment Schedule",
      "level": 1
    },
    {
      "type": "text",
      "content": "Loan Amount: $10,000\nInterest Rate: 8% per annum\nTenure: 12 months\nMonthly EMI: $869.88"
    },
    {
      "type": "table",
      "content": [
        ["Month", "EMI", "Principal", "Interest", "Outstanding"],
        ["Month 1", "$869.88", "$803.21", "$66.67", "$9,196.79"],
        ["Month 2", "$869.88", "$808.56", "$61.32", "$8,388.23"],
        ["Month 3", "$869.88", "$813.95", "$55.93", "$7,574.28"]
      ]
    }
  ]
}
<<</PDF>>>
```

**Result**: User sees the message and a download button for the PDF.

---

## ❓ FAQ

**Q: Can the LLM generate multiple PDFs in one response?**  
A: Currently, only one PDF per response is supported. The first valid PDF command will be processed.

**Q: What happens if the PDF JSON is invalid?**  
A: The system logs an error and continues with the text response. The PDF generation fails silently.

**Q: Can I customize PDF styling (colors, fonts)?**  
A: Currently, styling is fixed for consistency. Custom styling requires modifying `/api/generate-pdf/route.ts`.

**Q: Are PDFs stored on the server?**  
A: No, PDFs are generated on-demand and sent directly to the client as base64 data URIs. They are not stored.

**Q: Can PDFs include images?**  
A: Not currently supported. Only text-based content (headings, text, lists, tables).

**Q: How large can PDFs be?**  
A: There's no hard limit, but very large PDFs (>100 pages) may cause performance issues. Recommended max: 20-30 pages.

**Q: Does this work in voice calls?**  
A: Yes! During voice calls, the assistant can generate PDFs. Users will see the download link in the chat interface.

---

## 🚀 Best Practices

### 1. Clear Instructions in System Prompt

Be explicit about when and how PDFs should be generated:

```
When the user asks for [specific request], generate a PDF with:
- Section 1: [description]
- Section 2: [description]
- Include [specific data points]
```

### 2. User-Friendly Responses

Always acknowledge PDF creation in your text response:

```
"I've prepared a detailed summary for you. Please download the PDF below."
```

### 3. Structured Data

For tables, ensure data is well-organized:

```json
{
  "type": "table",
  "content": [
    ["Clear Header 1", "Clear Header 2"],  // Always have headers
    ["Data 1", "Data 2"],                   // Consistent columns
    ["Data 3", "Data 4"]
  ]
}
```

### 4. Meaningful Filenames

Use descriptive, date-stamped filenames:

```json
{
  "fileName": "loan_summary_john_doe_2025_01_15.pdf"
}
```

### 5. Content Hierarchy

Use proper heading levels to create clear document structure:

```json
[
  {"type": "heading", "content": "Main Title", "level": 1},
  {"type": "heading", "content": "Section", "level": 2},
  {"type": "heading", "content": "Subsection", "level": 3}
]
```

---

## 🎉 Success!

The PDF generation feature is now fully integrated! Your AI agents can create professional documents on-demand based on conversation context and system prompt instructions.

**Ready to test?** Update your agent's system prompt and start generating PDFs! 📄✨

---

_Last Updated: October 15, 2025_  
_Feature Version: 1.0_
