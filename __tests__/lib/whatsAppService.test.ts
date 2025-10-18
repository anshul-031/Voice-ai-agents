import * as whatsApp from '@/lib/whatsAppService'
import * as whatsAppService from '@/lib/whatsAppService'

describe('lib/whatsAppService', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL = 'https://api.meta.test/messages'
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN = 'test-token'
    ;(global as any).fetch = jest.fn()
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    jest.clearAllMocks()
    try { delete (global as any).fetch } catch (_) {}
  })

  test('sendMessage returns parsed response when ok and has response field', async () => {
    const serverResp = { response: { messaging_product: 'whatsapp', contacts: [], messages: [] } }
    ;(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => serverResp })

    const resp = await whatsApp.sendMessage({ messaging_product: 'whatsapp', recipient_type: 'individual', to: '919876543210', type: 'text', text: { body: 'hi' } })
    expect(resp).not.toBeNull()
    expect(resp?.messaging_product).toBe('whatsapp')
  })

  test('sendMessage returns null when url or token missing', async () => {
    delete process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL
    delete process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN
    const resp = await whatsApp.sendMessage({ messaging_product: 'whatsapp', recipient_type: 'individual', to: '1', type: 'text' })
    expect(resp).toBeNull()
  })

  test('sendMessage returns null on non-ok response', async () => {
    ;(global as any).fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => 'bad' })
    const resp = await whatsApp.sendMessage({ messaging_product: 'whatsapp', recipient_type: 'individual', to: '1', type: 'text' })
    expect(resp).toBeNull()
  })

  test('sendTextMessage sends payload via fetch', async () => {
    const mockResp = { messaging_product: 'whatsapp', contacts: [], messages: [] }
    ;(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockResp })
    const resp = await whatsApp.sendTextMessage('919876543210', 'hello')
    expect((global as any).fetch).toHaveBeenCalled()
    const body = (global as any).fetch.mock.calls[0][1].body
    expect(body).toContain('"to":"919876543210"')
    expect(body).toContain('"body":"hello"')
    expect(resp).not.toBeNull()
  })

  test('processWhatsAppCallback extracts and forwards message via fetch', async () => {
    const callback = {
      entry: [{ changes: [{ value: { messages: [{ from: '919876543210', text: { body: 'hey' } }] } }] }]
    }
    const mockResp = { messaging_product: 'whatsapp', contacts: [], messages: [] }
    ;(global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockResp })
    await whatsApp.processWhatsAppCallback(callback)
    expect((global as any).fetch).toHaveBeenCalled()
    const body = (global as any).fetch.mock.calls[0][1].body
    expect(body).toContain('"to":"919876543210"')
    expect(body).toContain('"body":"hey"')
  })
})
const { sendMessage, sendTextMessage, processWhatsAppCallback } = whatsAppService;

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL;
  delete process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('whatsAppService', () => {
  test('sendMessage returns null when env not set', async () => {
    const res = await sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '919876543210',
      type: 'text',
      text: { body: 'hi' }
    });
    expect(res).toBeNull();
  });

  test('sendMessage returns parsed response on success', async () => {
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN = 'token';

    const mockResponse = { messaging_product: 'whatsapp', contacts: [], messages: [] };

    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => mockResponse } as any);

    const res = await sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '919876543210',
      type: 'text',
      text: { body: 'hi' }
    });

    expect(res).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Authorization': 'Bearer token' })
      })
    );
  });

  test('sendMessage returns null on non-ok response', async () => {
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN = 'token';

    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, text: async () => 'err' } as any);

    const res = await sendMessage({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '919876543210',
      type: 'text',
      text: { body: 'hi' }
    });

    expect(res).toBeNull();
  });

  test('sendTextMessage delegates to sendMessage', async () => {
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN = 'token';

    const mockResponse = { messaging_product: 'whatsapp', contacts: [], messages: [] };
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => mockResponse } as any);

    const res = await sendTextMessage('919876543210', 'hello');
    expect(res).toEqual(mockResponse);
  });

  test('processWhatsAppCallback extracts message and triggers sendTextMessage (indirect via fetch)', async () => {
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN = 'token';

    // Mock fetch to observe calls from sendTextMessage/sendMessage
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ messaging_product: 'whatsapp' }) } as any);

    const callback = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { from: '919876543210', text: { body: 'hey' } }
                ]
              }
            }
          ]
        }
      ]
    };

    await processWhatsAppCallback(callback as any);

    // sendTextMessage -> sendMessage -> fetch should have been called
    expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
    const calledBody = (global.fetch as jest.Mock).mock.calls[0][1].body;
    expect(String(calledBody)).toContain('hey');
  });
});
