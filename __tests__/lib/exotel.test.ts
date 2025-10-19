/**
 * @jest-environment node
 */

import * as exotel from '@/lib/exotel';

const originalFetch = global.fetch;
const envKeys = [
  'EXOTEL_AUTH_KEY',
  'EXOTEL_AUTH_TOKEN',
  'EXOTEL_SUBDOMAIN',
  'EXOTEL_ACCOUNT_SID',
  'EXOTEL_CALLER_ID',
  'EXOTEL_URL',
] as const;

const envBackup: Record<(typeof envKeys)[number], string | undefined> = envKeys.reduce(
  (acc, key) => ({ ...acc, [key]: process.env[key] }),
  {} as Record<(typeof envKeys)[number], string | undefined>
);

const defaultEnv: Record<(typeof envKeys)[number], string> = {
  EXOTEL_AUTH_KEY: 'key',
  EXOTEL_AUTH_TOKEN: 'token',
  EXOTEL_SUBDOMAIN: 'api.exotel.com',
  EXOTEL_ACCOUNT_SID: 'AC123',
  EXOTEL_CALLER_ID: 'caller',
  EXOTEL_URL: 'https://example.com/call',
};

const createFetchResponse = <T,>(data: T, ok = true): Response => ({
  ok,
  json: jest.fn().mockResolvedValue(data),
} as unknown as Response);

describe('lib/exotel', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (global as typeof global & { fetch: jest.Mock }).fetch = fetchMock;

    envKeys.forEach((key) => {
      process.env[key] = defaultEnv[key];
    });
  });

  afterEach(() => {
    (global as typeof global & { fetch: typeof fetch }).fetch = originalFetch;
    jest.restoreAllMocks();

    envKeys.forEach((key) => {
      const originalValue = envBackup[key];
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    });
  });

  describe('formatPhoneNumber', () => {
    it('returns existing 91-prefixed numbers as-is', () => {
      expect(exotel.formatPhoneNumber('919876543210')).toBe('919876543210');
    });

    it('adds 91 prefix to 10-digit numbers', () => {
      expect(exotel.formatPhoneNumber('9876543210')).toBe('919876543210');
    });

    it('converts leading zero to 91 prefix', () => {
      expect(exotel.formatPhoneNumber('09123456789')).toBe('919123456789');
    });

    it('strips non-digit characters when formatting', () => {
      expect(exotel.formatPhoneNumber('+91 98765-43210')).toBe('919876543210');
    });
  });

  describe('triggerExotelCall', () => {
    it('rejects invalid phone numbers before making a request', async () => {
      const result = await exotel.triggerExotelCall({ phoneNumber: '123' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch('Invalid phone number format');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends a call request when configuration is valid', async () => {
      fetchMock.mockResolvedValueOnce(
        createFetchResponse({ Call: { Sid: 'SID123', Status: 'queued' } })
      );

      const result = await exotel.triggerExotelCall({ phoneNumber: '9876543210' });

      const expectedUrl = `https://${defaultEnv.EXOTEL_SUBDOMAIN}/v1/Accounts/${defaultEnv.EXOTEL_ACCOUNT_SID}/Calls/connect.json`;
      expect(fetchMock).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from(`${defaultEnv.EXOTEL_AUTH_KEY}:${defaultEnv.EXOTEL_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );

      const body = (fetchMock.mock.calls[0][1] as RequestInit).body as string;
      expect(body).toContain('From=919876543210');
      expect(body).toContain(`CallerId=${defaultEnv.EXOTEL_CALLER_ID}`);
      expect(body).toContain(`Url=${encodeURIComponent(defaultEnv.EXOTEL_URL)}`);

      expect(result).toEqual({
        success: true,
        callSid: 'SID123',
        status: 'queued',
        phoneNumber: '9876543210',
      });
    });

    it('returns API error details when call initiation fails', async () => {
      fetchMock.mockResolvedValueOnce(
        createFetchResponse({ RestException: { Message: 'Bad request' } }, false)
      );

      const result = await exotel.triggerExotelCall({ phoneNumber: '9876543210' });

      expect(result).toEqual({
        success: false,
        error: 'Bad request',
        phoneNumber: '9876543210',
      });
    });

    it('handles fetch rejections gracefully', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      fetchMock.mockRejectedValueOnce(new Error('Network fail'));

      const result = await exotel.triggerExotelCall({ phoneNumber: '9876543210' });

      expect(result).toEqual({
        success: false,
        error: 'Network fail',
        phoneNumber: '9876543210',
      });
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('triggerBulkCalls', () => {
    it('invokes progress callback and aggregates results', async () => {
      fetchMock
        .mockResolvedValueOnce(createFetchResponse({ Call: { Sid: 'sid-1', Status: 'queued' } }))
        .mockResolvedValueOnce(
          createFetchResponse({ RestException: { Message: 'Blocked' } }, false)
        );

      const progress = jest.fn();
      const contacts = [
        { phoneNumber: '9876543210' },
        { phoneNumber: '9123456789' },
      ];

      const results = await exotel.triggerBulkCalls(contacts, progress, 0);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(progress).toHaveBeenNthCalledWith(
        1,
        1,
        2,
        expect.objectContaining({ success: true, callSid: 'sid-1', phoneNumber: '9876543210' })
      );
      expect(progress).toHaveBeenNthCalledWith(
        2,
        2,
        2,
        expect.objectContaining({ success: false, error: 'Blocked', phoneNumber: '9123456789' })
      );
      expect(results).toEqual([
        { success: true, callSid: 'sid-1', status: 'queued', phoneNumber: '9876543210' },
        { success: false, error: 'Blocked', phoneNumber: '9123456789' },
      ]);
    });

    it('continues execution when a call throws', async () => {
      fetchMock
        .mockResolvedValueOnce(createFetchResponse({ Call: { Sid: 'sid-1', Status: 'queued' } }))
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValueOnce(createFetchResponse({ Call: { Sid: 'sid-3', Status: 'queued' } }));

      const results = await exotel.triggerBulkCalls(
        [
          { phoneNumber: '9876543210' },
          { phoneNumber: '9876543211' },
          { phoneNumber: '9876543212' },
        ],
        undefined,
        0
      );

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('network down');
      expect(results[2].success).toBe(true);
    });

    it('handles runs without progress callbacks', async () => {
      fetchMock.mockResolvedValue(createFetchResponse({ Call: { Sid: 'sid', Status: 'queued' } }));

      const results = await exotel.triggerBulkCalls([{ phoneNumber: '9876543210' }], undefined, 0);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(results).toEqual([
        { success: true, callSid: 'sid', status: 'queued', phoneNumber: '9876543210' },
      ]);
    });
  });

  describe('validateExotelConfig', () => {
    it('reports valid configuration when all fields exist', () => {
      const result = exotel.validateExotelConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('lists missing fields when configuration is incomplete', () => {
      envKeys.forEach((key) => {
        delete process.env[key];
      });

      const result = exotel.validateExotelConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        'EXOTEL_AUTH_KEY is missing',
        'EXOTEL_AUTH_TOKEN is missing',
        'EXOTEL_ACCOUNT_SID is missing',
        'EXOTEL_CALLER_ID is missing',
        'EXOTEL_URL is missing',
      ]);
    });
  });
});

