/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/payment-webhook/route'
import { createDecipheriv } from 'crypto'
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

    it('echoes hello for msg=Hi (case-insensitive, alt param)', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook?msg=Hi')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('handles invalid URL parse gracefully and returns health JSON', async () => {
      const badReq = { url: 'not-a-valid:url' } as any
      const res = await GET(badReq)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('service', 'Payment Webhook Handler')
      expect(data).toHaveProperty('status', 'operational')
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

    it('echoes hello for JSON body with text=hi', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ text: 'hi' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe(' hello ')
    })

    it('echoes hello for JSON body with body=Hi (case-insensitive)', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ body: 'Hi' }),
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

    it('echoes hello for urlencoded body with msg=Hi (case-insensitive)', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: 'msg=Hi',
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

    it('returns INVALID_JSON for JSON string not equal to hi', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: '"hello"',
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'INVALID_JSON' })
    })

    it('accepts urlencoded phoneNumber and returns success', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: 'phoneNumber=%2B15550001111',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({ success: true, phoneNumber: '+15550001111' })
    })

    it('parses JSON from text/plain and succeeds when phone present', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: '{"phoneNumber":"+15550002222"}',
        headers: { 'Content-Type': 'text/plain' },
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({ success: true, phoneNumber: '+15550002222' })
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

    it('accepts camelCase phoneNumber and returns success (normalized)', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '+1 (555) 000-1111' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({ success: true, phoneNumber: '+15550001111' })
    })

    it('coerces numeric phoneNumber input to string before validation', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: 9876543210 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({ success: true, phoneNumber: '9876543210' })
    })

    it('normalizes phone numbers starting with 00 to a single + prefix', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '00919876543210' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toMatchObject({ success: true, phoneNumber: '+919876543210' })
    })
    
    it('returns 400 for invalid JSON when Content-Type is text/plain', async () => {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'text/plain' },
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'INVALID_JSON' })
    })
  })

  describe('POST - Forwarding path (AES + optional hash)', () => {
    const VALID_AES_KEY = '12345678901234567890123456789012' // 32 bytes
    const API_URL = 'https://example.com/forward'
    const BIZ_TOKEN = 'test-biz-token'

    const setEnv = (vars: Record<string, string | undefined>) => {
      for (const [k, v] of Object.entries(vars)) {
        if (v === undefined) delete process.env[k]
        else process.env[k] = v
      }
    }

    const resetForwardEnv = () => {
      delete process.env.PAYMENT_WEBHOOK_FORWARD_ENABLED
      delete process.env.PL_FORWARD_ENABLED
      delete process.env.PL_API_URL
      delete process.env.PL_AES_KEY
      delete process.env.PL_X_BIZ_TOKEN
      delete process.env.PL_USE_HASH
      delete process.env.PL_CLIENT_ID
      delete process.env.PL_CLIENT_SECRET
    }

    beforeEach(() => {
      // Reset fetch mock and env
      ;(global.fetch as jest.Mock).mockReset()
      resetForwardEnv()
    })

    afterEach(() => {
      resetForwardEnv()
    })

    const decryptForwardedBody = (ciphertext: string) => {
      const keyBuffer = Buffer.from(VALID_AES_KEY, 'utf8')
      const iv = keyBuffer.subarray(0, 16)
      const padded = ciphertext + '='.repeat((4 - (ciphertext.length % 4)) % 4)
      const data = Buffer.from(padded, 'base64')
      const decipher = createDecipheriv('aes-256-cbc', keyBuffer, iv)
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
      return decrypted.toString('utf8')
    }

    it('returns 500 CONFIG_MISSING when forwarding enabled but required envs absent', async () => {
      setEnv({ PL_FORWARD_ENABLED: 'true' })
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '+15550001111' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'CONFIG_MISSING' })
    })

    it('treats blank forwarding env vars as missing configuration', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: '',
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: '',
      })

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15550001234' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'CONFIG_MISSING' })
    })

    it('also enables forwarding via PAYMENT_WEBHOOK_FORWARD_ENABLED env', async () => {
      setEnv({ PAYMENT_WEBHOOK_FORWARD_ENABLED: 'true' })
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15550004444' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'CONFIG_MISSING' })
    })

    it('returns 500 CONFIG_MISSING when PL_USE_HASH=true but client creds missing', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
        PL_USE_HASH: 'true',
        // Intentionally omit PL_CLIENT_ID / PL_CLIENT_SECRET
      })
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '+15550001111' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, error: 'CONFIG_MISSING' })
    })

    it('forwards successfully with minimal envs (no hash) and JSON response', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true, id: 'abc123' }),
      })

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15550001111', amount: 10 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.forwarded).toBe(true)
      expect(data.success).toBe(true)
      expect(data.status).toBe(200)
      expect(data.data).toMatchObject({ ok: true, id: 'abc123' })
      // Ensure we posted encrypted payload (non-JSON body)
      const call = (global.fetch as jest.Mock).mock.calls[0]
      expect(call[0]).toBe(API_URL)
      const sentBody = call[1]?.body
      expect(typeof sentBody).toBe('string')
      // Encrypted body won't be valid JSON
      expect(() => JSON.parse(sentBody as string)).toThrow()
    })

    it('forwards successfully with hashing and complex channels/custom fields, handling non-JSON response', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
        PL_USE_HASH: 'true',
        PL_CLIENT_ID: 'cid123',
        PL_CLIENT_SECRET: 'csecret456',
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
      })

      const payload = {
        phone_number: '+15550002222',
        email: 'u@example.com',
        full_name: 'U N. A.',
        amount: 99,
        due_date: '2025-01-01T00:00:00.000Z',
        account_id: 'acc-1',
        send_notification: true,
        template_name: 'temp-x',
        merchant_reference_number: 'ref-9',
        pref_lang_code: 'en',
        notification_channel: {
          whatsapp: '1',
          whatsappOD: '0',
          whatsappUPIINTENT: 'yes',
          sms: '1',
          email: '0',
        },
        custom_field: {
          custom_field1: 'a',
          custom_field2: 'b',
          custom_field3: 'c',
          custom_field4: 'd',
          custom_field5: 'e',
          custom_field6: 'f',
          custom_field7: 'g',
          custom_field8: 'h',
        },
      }

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.forwarded).toBe(true)
      expect(data.success).toBe(true)
      expect(data.status).toBe(200)
      // Non-JSON response should be wrapped into { raw: ... }
      expect(data.data).toMatchObject({ raw: 'OK' })
      // Ensure fetch called with proper headers
      const call = (global.fetch as jest.Mock).mock.calls[0]
      const hdrs = call[1]?.headers || {}
      expect(hdrs['X-Biz-Token']).toBe(BIZ_TOKEN)
    })

    it('propagates non-OK status from upstream (e.g., 400)', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'bad-request' }),
      })

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15550005555' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.forwarded).toBe(true)
      expect(data.success).toBe(false)
      expect(data.status).toBe(400)
      expect(data.data).toMatchObject({ error: 'bad-request' })
    })

    it('fills default forwarding fields when optional values are missing', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'))

      try {
        setEnv({
          PL_FORWARD_ENABLED: 'true',
          PL_API_URL: API_URL,
          PL_AES_KEY: VALID_AES_KEY,
          PL_X_BIZ_TOKEN: BIZ_TOKEN,
        })

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true }),
        })

        const req = new NextRequest('http://localhost/api/payment-webhook', {
          method: 'POST',
          body: JSON.stringify({ phoneNumber: '+15550009999' }),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)

        const call = (global.fetch as jest.Mock).mock.calls[0]
        const encryptedBody = call[1]?.body as string
        const decrypted = JSON.parse(decryptForwardedBody(encryptedBody))

        expect(decrypted).toMatchObject({
          phone_number: '+15550009999',
          email: 'test_1@pelocal.com',
          full_name: 'Voice AI Customer',
          amount: 1,
          due_date: '2025-01-04',
          account_id: '321143',
          send_notification: true,
          template_name: 'pl_pmt_od_template',
          merchant_reference_number: '',
          pref_lang_code: 'en',
        })
        expect(decrypted.notification_channel).toMatchObject({
          whatsapp: 'N',
          whatsappOD: 'N',
          sms: 'N',
          email: 'N',
          whatsappODPL: 'Y',
        })
        expect(decrypted.custom_field).toMatchObject({
          custom_field1: '',
          custom_field8: '',
        })
      } finally {
        jest.useRealTimers()
      }
    })

    it('parses numeric string amounts before forwarding', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      })

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15551112222', amount: '7.5' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)

      const call = (global.fetch as jest.Mock).mock.calls[0]
      const encryptedBody = call[1]?.body as string
      const decrypted = JSON.parse(decryptForwardedBody(encryptedBody))
      expect(decrypted.amount).toBe(7.5)
    })

    it('honors provided ISO due_date and explicit send_notification boolean', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      })

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: '+15553334444',
          due_date: '2025-08-15',
          send_notification: false,
          amount: 15,
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)

      const call = (global.fetch as jest.Mock).mock.calls[0]
      const encryptedBody = call[1]?.body as string
      const decrypted = JSON.parse(decryptForwardedBody(encryptedBody))
      expect(decrypted.due_date).toBe('2025-08-15')
      expect(decrypted.send_notification).toBe(false)
      expect(decrypted.amount).toBe(15)
    })

    it('falls back to defaults when amount is non-numeric and channel/custom inputs are invalid objects', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-03-10T00:00:00Z'))

      try {
        setEnv({
          PL_FORWARD_ENABLED: 'true',
          PL_API_URL: API_URL,
          PL_AES_KEY: VALID_AES_KEY,
          PL_X_BIZ_TOKEN: BIZ_TOKEN,
        })

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true }),
        })

        const req = new NextRequest('http://localhost/api/payment-webhook', {
          method: 'POST',
          body: JSON.stringify({
            phone_number: '+15556667777',
            amount: 'abc',
            notification_channel: ['bad'],
            custom_field: 'oops',
          }),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)

        const call = (global.fetch as jest.Mock).mock.calls[0]
        const encryptedBody = call[1]?.body as string
        const decrypted = JSON.parse(decryptForwardedBody(encryptedBody))
        expect(decrypted.amount).toBe(1)
        expect(decrypted.due_date).toBe('2025-03-13')
        expect(decrypted.notification_channel).toMatchObject({
          whatsapp: 'N',
          whatsappOD: 'N',
          sms: 'N',
          email: 'N',
          whatsappODPL: 'Y',
        })
        expect(decrypted.custom_field).toMatchObject({ custom_field1: '' })
      } finally {
        jest.useRealTimers()
      }
    })

    it('falls back to default amount when provided value is blank string', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      })

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15559998888', amount: '   ' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)

      const call = (global.fetch as jest.Mock).mock.calls[0]
      const encryptedBody = call[1]?.body as string
      const decrypted = JSON.parse(decryptForwardedBody(encryptedBody))
      expect(decrypted.amount).toBe(1)
    })

    it('uses default due_date when provided value is malformed', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-04-01T00:00:00Z'))

      try {
        setEnv({
          PL_FORWARD_ENABLED: 'true',
          PL_API_URL: API_URL,
          PL_AES_KEY: VALID_AES_KEY,
          PL_X_BIZ_TOKEN: BIZ_TOKEN,
        })

        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true }),
        })

        const req = new NextRequest('http://localhost/api/payment-webhook', {
          method: 'POST',
          body: JSON.stringify({
            phone_number: '+15558889999',
            due_date: '04/20/2025',
          }),
        })
        const res = await POST(req)
        expect(res.status).toBe(200)

        const call = (global.fetch as jest.Mock).mock.calls[0]
        const encryptedBody = call[1]?.body as string
        const decrypted = JSON.parse(decryptForwardedBody(encryptedBody))
        expect(decrypted.due_date).toBe('2025-04-04')
      } finally {
        jest.useRealTimers()
      }
    })

    it('returns 502 FORWARD_FAILED if fetch throws', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network down'))

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15550003333' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(502)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, forwarded: true, error: 'FORWARD_FAILED' })
    })

    it('returns 502 FORWARD_FAILED when AES key length is invalid (ensureKey32Bytes branch)', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        // 16 bytes only, should fail
        PL_AES_KEY: 'short-key-16-bytes',
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15550006666' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(502)
      const data = await res.json()
      expect(data).toMatchObject({ success: false, forwarded: true, error: 'FORWARD_FAILED' })
    })

    it('hashing enabled without whatsappUPIINTENT (false branch) still forwards successfully', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
        PL_USE_HASH: 'true',
        PL_CLIENT_ID: 'cid-xyz',
        PL_CLIENT_SECRET: 'secret-xyz',
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      })

      const payload = {
        phone_number: '+15550007777',
        notification_channel: {
          whatsapp: '1',
          whatsappOD: '0',
          // intentionally omit whatsappUPIINTENT
          sms: '1',
          email: '1',
        },
        custom_field: { custom_field1: 'x' },
      }

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.forwarded).toBe(true)
      expect(data.success).toBe(true)
      expect(data.status).toBe(200)
      expect(data.data).toMatchObject({ ok: true })
    })

    it('handles non-Error exceptions in forwarding with unknown error message', async () => {
      setEnv({
        PL_FORWARD_ENABLED: 'true',
        PL_API_URL: API_URL,
        PL_AES_KEY: VALID_AES_KEY,
        PL_X_BIZ_TOKEN: BIZ_TOKEN,
      })

      ;(global.fetch as jest.Mock).mockImplementation(() => Promise.reject('network failure'))

      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phone_number: '+15550008888' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(502)
      const data = await res.json()
      expect(data).toMatchObject({
        success: false,
        forwarded: true,
        error: 'FORWARD_FAILED'
      })
    })
  })
})

describe('/api/payment-webhook route - additional branches', () => {
  it('returns 400 INVALID_JSON when JSON body is null (payload falsy branch)', async () => {
    const req = new NextRequest('http://localhost/api/payment-webhook', {
      method: 'POST',
      body: 'null',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toMatchObject({ success: false, error: 'INVALID_JSON' })
  })

  it.skip('handles non-Error exceptions in request parsing with unknown error message', async () => {
    const originalJson = Request.prototype.json;
    Request.prototype.json = jest.fn().mockRejectedValue('json parse failure');
    try {
      const req = new NextRequest('http://localhost/api/payment-webhook', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: '+15550009999' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toMatchObject({
        success: false,
        message: 'Internal server error',
        error: 'Unknown error'
      });
    } finally {
      Request.prototype.json = originalJson;
    }
  })
})
