# 📄 PDF Generation - Quick Reference Card

## 🚀 Quick Start (30 seconds)

### 1. Add to System Prompt
```
When user asks for [document type], respond with:
"I've prepared the document for you."

<<<PDF>>>
{
  "title": "Document Title",
  "sections": [
    {"type": "heading", "content": "Title", "level": 1},
    {"type": "text", "content": "Your content here"},
    {"type": "list", "content": ["Item 1", "Item 2"]},
    {
      "type": "table",
      "content": [
        ["Header1", "Header2"],
        ["Data1", "Data2"]
      ]
    }
  ]
}
<<</PDF>>>
```

### 2. Test It
- Go to `/agents/[id]`
- Update system prompt
- Ask: "Can you send me [document]?"
- Download PDF from chat

---

## 📐 Section Types

| Type | Example | Use For |
|------|---------|---------|
| `heading` | `{"type": "heading", "content": "Title", "level": 1}` | Section titles |
| `text` | `{"type": "text", "content": "Paragraph..."}` | Body text |
| `list` | `{"type": "list", "content": ["A", "B", "C"]}` | Bullet points |
| `table` | `{"type": "table", "content": [["H1", "H2"], ["D1", "D2"]]}` | Tabular data |

**Heading Levels**: 1 (large), 2 (medium), 3 (small)

---

## ✅ Checklist

- [ ] System prompt includes PDF command format
- [ ] Command wrapped in `<<<PDF>>>` tags
- [ ] JSON is valid (use JSON validator if needed)
- [ ] All table rows have same column count
- [ ] Filename is descriptive (e.g., `invoice_001.pdf`)

---

## 🎯 Common Patterns

### Invoice
```json
{
  "title": "Invoice #001",
  "sections": [
    {"type": "heading", "content": "INVOICE", "level": 1},
    {"type": "text", "content": "Date: Jan 15\nDue: Feb 15"},
    {"type": "table", "content": [
      ["Item", "Qty", "Price", "Total"],
      ["Service", "1", "$100", "$100"]
    ]}
  ]
}
```

### Payment Schedule
```json
{
  "title": "Payment Schedule",
  "sections": [
    {"type": "heading", "content": "EMI Schedule", "level": 1},
    {"type": "table", "content": [
      ["Month", "EMI", "Balance"],
      ["Jan", "$500", "$9,500"],
      ["Feb", "$500", "$9,000"]
    ]}
  ]
}
```

### Meeting Notes
```json
{
  "title": "Meeting Notes",
  "sections": [
    {"type": "heading", "content": "Summary", "level": 1},
    {"type": "text", "content": "Date: Jan 15\nAttendees: A, B, C"},
    {"type": "heading", "content": "Action Items", "level": 2},
    {"type": "list", "content": [
      "Task 1 - Owner: John",
      "Task 2 - Owner: Sarah"
    ]}
  ]
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| PDF not appearing | Check browser console for JSON errors |
| Broken format | Verify `<<<PDF>>>` tags are present |
| Table misaligned | Ensure equal column counts in all rows |
| Download fails | Check filename has `.pdf` extension |
| Content cut off | Reduce content or split into pages |

---

## 💡 Pro Tips

1. **Test JSON First**: Use [jsonlint.com](https://jsonlint.com) to validate
2. **Short Filenames**: Use underscores, no spaces
3. **Clear Headings**: Use level 1 for main title only
4. **Consistent Tables**: Same columns in every row
5. **Check Console**: Look for `[LLM] PDF command detected`

---

## 📚 Full Documentation

- **Complete Guide**: `PDF_GENERATION_GUIDE.md`
- **Examples**: `PDF_EXAMPLES.md`
- **Implementation**: `PDF_FEATURE_SUMMARY.md`

---

**Ready? Update your agent's system prompt and test!** ✨
