/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// Use manual mock in __mocks__/jspdf.js
jest.mock('jspdf')

import { POST } from '@/app/api/generate-pdf/route'

describe('generate-pdf route', () => {
  test('returns 400 when required fields missing', async () => {
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify({ title: '', sections: null }) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  test('returns pdf data on valid request', async () => {
    const body = {
      title: 'My Doc',
      sections: [
        { type: 'heading', content: 'Intro', level: 1 },
        { type: 'text', content: 'Hello world' },
        { type: 'list', content: ['one', 'two'] },
      ],
      fileName: 'custom.pdf'
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.pdfData).toContain('data:application/pdf')
    expect(data.fileName).toBe('custom.pdf')
  })

  test('handles table sections', async () => {
    const body = {
      title: 'Table Doc',
      sections: [
        { type: 'table', content: [['Header1', 'Header2'], ['Row1', 'Row2']] },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('handles unknown section type', async () => {
    const body = {
      title: 'Unknown Doc',
      sections: [
        { type: 'unknown', content: 'test' },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('handles invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: 'invalid json' })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to generate PDF')
  })

  test('handles empty table data', async () => {
    const body = {
      title: 'Empty Table Doc',
      sections: [
        { type: 'table', content: [] },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('handles jsPDF errors during PDF generation', async () => {
    // Mock jsPDF constructor to throw an error
    const { jsPDF } = require('jspdf')
    ;(jsPDF as jest.Mock).mockImplementationOnce(() => {
      throw new Error('PDF generation failed')
    })

    const body = {
      title: 'Error Doc',
      sections: [
        { type: 'text', content: 'This will fail' },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to generate PDF')
    expect(data.details).toBe('PDF generation failed')
  })

  test('handles non-Error instance exceptions', async () => {
    // Mock jsPDF constructor to throw a non-Error object
    const { jsPDF } = require('jspdf')
    ;(jsPDF as jest.Mock).mockImplementationOnce(() => {
      throw 'String error'
    })

    const body = {
      title: 'String Error Doc',
      sections: [
        { type: 'text', content: 'This will fail with string' },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to generate PDF')
    expect(data.details).toBe('Unknown error')
  })

  test('handles page breaks correctly', async () => {
    // This test ensures the checkPageBreak function is called
    const body = {
      title: 'Page Break Test',
      sections: [
        { type: 'text', content: 'A'.repeat(1000) }, // Long text to trigger page break
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('handles multiple section types in one document', async () => {
    const body = {
      title: 'Multi Section Doc',
      sections: [
        { type: 'heading', content: 'Main Title', level: 1 },
        { type: 'heading', content: 'Sub Title', level: 2 },
        { type: 'text', content: 'Some text content' },
        { type: 'list', content: ['Item 1', 'Item 2', 'Item 3'] },
        { type: 'table', content: [['Header1', 'Header2'], ['Row1', 'Row2']] },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('handles heading levels correctly', async () => {
    const body = {
      title: 'Heading Levels Test',
      sections: [
        { type: 'heading', content: 'Level 1', level: 1 },
        { type: 'heading', content: 'Level 2', level: 2 },
        { type: 'heading', content: 'Level 3', level: 3 },
        { type: 'heading', content: 'Default Level', level: undefined },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('handles list items with line breaks', async () => {
    const body = {
      title: 'List Test',
      sections: [
        { type: 'list', content: ['Short item', 'A very long item that should wrap to multiple lines and test the line breaking functionality properly'] },
      ],
    }
    const req = new NextRequest('http://localhost/api/generate-pdf', { method: 'POST', body: JSON.stringify(body) })
    const res: any = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
