import * as exotel from '@/lib/exotel'

describe('lib/exotel', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    // provide default valid config
    process.env.EXOTEL_AUTH_KEY = 'key'
    process.env.EXOTEL_AUTH_TOKEN = 'token'
    process.env.EXOTEL_SUBDOMAIN = 'api.exotel.com'
    process.env.EXOTEL_ACCOUNT_SID = 'AC123'
    process.env.EXOTEL_CALLER_ID = 'caller'
    process.env.EXOTEL_URL = 'https://example.com/call'
    ;(global as any).fetch = jest.fn()
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    jest.clearAllMocks()
    try {
      delete (global as any).fetch
    } catch (_) {}
  })

  test('formatPhoneNumber handles various formats', () => {
    expect(exotel.formatPhoneNumber('9876543210')).toBe('919876543210')
    // 11-digit starting with 0 -> remove leading 0 and add 91
    expect(exotel.formatPhoneNumber('09123456789')).toBe('919123456789')
    expect(exotel.formatPhoneNumber('+91 98765-43210')).toBe('919876543210')
    expect(exotel.formatPhoneNumber('919876543210')).toBe('919876543210')
  })

  test('validateExotelConfig returns errors when missing', () => {
    delete process.env.EXOTEL_AUTH_KEY
    delete process.env.EXOTEL_AUTH_TOKEN
    const result = exotel.validateExotelConfig()
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  test('triggerExotelCall returns success when API responds with call object', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ Call: { Sid: 'SID123', Status: 'queued' } }),
    }
    ;(global as any).fetch = jest.fn().mockResolvedValue(mockResponse)

    const res = await exotel.triggerExotelCall({ phoneNumber: '9876543210' })
    expect(res.success).toBe(true)
    expect(res.callSid).toBe('SID123')
  })

  test('triggerExotelCall returns failure when API returns error', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ RestException: { Message: 'Bad request' } }),
    }
    ;(global as any).fetch = jest.fn().mockResolvedValue(mockResponse)

    const res = await exotel.triggerExotelCall({ phoneNumber: '123' })
    expect(res.success).toBe(false)
    expect(res.error).toBeDefined()
  })

  test('triggerExotelCall handles network errors gracefully', async () => {
    ;(global as any).fetch = jest.fn().mockRejectedValue(new Error('Network fail'))

    const res = await exotel.triggerExotelCall({ phoneNumber: '9876543210' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Network fail/)
  })

  test('triggerExotelCall sends proper headers and formatted body', async () => {
    const mockResponse = { ok: true, json: async () => ({ Call: { Sid: 'S', Status: 'queued' } }) }
    const fetchMock = jest.fn().mockResolvedValue(mockResponse)
    ;(global as any).fetch = fetchMock

    await exotel.triggerExotelCall({ phoneNumber: '9876543210' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(options.headers['Authorization']).toMatch(/^Basic /)
    expect(options.body).toContain('From=919876543210')
  })

  test('triggerBulkCalls calls triggerExotelCall for each contact and reports progress', async () => {
    const mockResponse = { ok: true, json: async () => ({ Call: { Sid: 'S1', Status: 'queued' } }) }
    ;(global as any).fetch = jest.fn().mockResolvedValue(mockResponse)

    const contacts = [
      { phoneNumber: '9876543210' },
      { phoneNumber: '9123456789' },
    ]

    const progress: Array<{ completed: number; total: number }> = []
    const onProgress = (_completed: number, _total: number) => {
      progress.push({ completed: _completed, total: _total })
    }

    const results = await exotel.triggerBulkCalls(contacts, onProgress, 0)
    expect(results).toHaveLength(2)
    expect(progress).toHaveLength(2)
  })

  test('triggerBulkCalls continues when a call fails', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Call: { Sid: 'sid1', Status: 'queued' } }) })
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Call: { Sid: 'sid3', Status: 'queued' } }) })

    ;(global as any).fetch = fetchMock

    const contacts = [
      { phoneNumber: '9876543210' },
      { phoneNumber: '9876543211' },
      { phoneNumber: '9876543212' }
    ]

    const results = await exotel.triggerBulkCalls(contacts, undefined, 0)
    expect(results).toHaveLength(3)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
    expect(results[2].success).toBe(true)
  })
})

