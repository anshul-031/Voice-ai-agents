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
  })

  describe('POST - Payload validation', () => {
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
