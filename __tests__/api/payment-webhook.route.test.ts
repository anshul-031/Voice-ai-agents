/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/payment-webhook/route'
import { NextRequest } from 'next/server'

describe('/api/payment-webhook route', () => {
  describe('GET - Health check', () => {
    it('returns operational status JSON with 200', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('service', 'Payment Webhook Handler')
      expect(data).toHaveProperty('status', 'operational')
      expect(data).toHaveProperty('endpoints')
    })

    it('echoes hello for message=hi via query', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook?message=hi')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe(' hello ')
    })
  })

  describe('POST - Payload validation', () => {
    it('echoes hello for text/plain body with hi', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: 'hi',
        headers: { 'Content-Type': 'text/plain' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type') || '').toContain('text/plain')
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('echoes hello for JSON body with message=hi', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ message: 'hi' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type') || '').toContain('text/plain')
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('echoes hello for JSON body with message=Hi (case-insensitive)', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hi' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('echoes hello when Content-Type is missing and body is plain hi', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: 'hi',
        // deliberately no Content-Type header
      } as any)
      const res = await POST(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('echoes hello for urlencoded body with message=hi', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: 'message=hi',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('echoes hello for JSON string body "hi"', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: '"hi"',
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('returns 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        // Intentionally invalid JSON string
        body: 'invalid json',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'INVALID_JSON' })
    })

    it('returns 400 when phone number missing', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ amount: 100 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'MISSING_PHONE_NUMBER' })
    })

    it('returns 400 for invalid phone format', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: 'invalid' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'INVALID_PHONE_FORMAT' })
    })

    it('accepts snake_case phone_number and returns success', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+919876543210', transactionId: 'txn_123' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({ success: true, phoneNumber: '+919876543210' })
      expect(data.transactionId).toBe('txn_123')
      expect(typeof data.timestamp).toBe('string')
    })

    it('accepts camelCase phoneNumber and returns success', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '+1 (555) 000-1111' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({ success: true, phoneNumber: '+1 (555) 000-1111' })
    })
  })
})
