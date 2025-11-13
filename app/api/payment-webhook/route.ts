/**
 * Payment Webhook Handler
 * Receives payment notifications with phone number
 * and sends acknowledgment responses
 */

import { createCipheriv, createDecipheriv } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface PaymentWebhookRequest {
  phone_number?: string;
  phoneNumber?: string;
  amount?: number;
  dueAmount?: number;
  transactionId?: string;
  status?: string;
  timestamp?: string;
  templateID?: string;
  templateId?: string;
  template_id?: string;
}

interface PaymentWebhookResponse {
  success: boolean;
  message: string;
  phoneNumber: string;
  timestamp: string;
  transactionId?: string;
}

const DEFAULT_FORWARDING_VALUES = Object.freeze({
  email: 'test_1@pelocal.com',
  full_name: 'Voice AI Customer',
  amount: 1,
  due_date_offset_days: 3,
  account_id: '321143',
  send_notification: true,
  template_name: 'pl_pmt_od_template',
  merchant_reference_number: '',
  pref_lang_code: 'en',
  notification_channel: Object.freeze({
    whatsapp: 'N',
    whatsappOD: 'N',
    sms: 'N',
    email: 'N',
    whatsappODPL: 'Y',
  }),
  custom_field: Object.freeze({
    custom_field1: '',
    custom_field2: '',
    custom_field3: '',
    custom_field4: '',
    custom_field5: '',
    custom_field6: '',
    custom_field7: '',
    custom_field8: '',
  }),
});

function resolvePositiveAmount(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_FORWARDING_VALUES.amount;
}

function resolveDueDate(raw: unknown, offsetDays: number): string {
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return raw.trim();
  }
  const date = new Date();
  date.setDate(date.getDate() + Math.max(offsetDays, 0));
  return date.toISOString().split('T')[0];
}

function asPlainObject(value: unknown): Record<string, any> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return undefined;
}

/**
 * Resolve template name and language code from incoming templateID
 * Rules:
 * - If templateID is "pl_payment_link_ml", use it and set lang to "ml"
 * - Otherwise use default "pl_pmt_od_template" with lang "en"
 */
function resolveTemplateAndLang(
  templateID?: string
): { template_name: string; pref_lang_code: string } {
  const normalized = (templateID || '').trim();
  if (normalized === 'pl_payment_link_ml') {
    console.log('[Payment Webhook] Template detected: pl_payment_link_ml with lang ml');
    return {
      template_name: 'pl_payment_link_ml',
      pref_lang_code: 'ml',
    };
  }
  console.log('[Payment Webhook] Using default template: pl_pmt_od_template with lang en');
  return {
    template_name: DEFAULT_FORWARDING_VALUES.template_name,
    pref_lang_code: DEFAULT_FORWARDING_VALUES.pref_lang_code,
  };
}

// --- External API Forwarding Helpers ---
function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function ensureKey32Bytes(key?: string): Buffer {
  if (!key) throw new Error('AES key missing');
  const buf = Buffer.from(key, 'utf8');
  if (buf.length !== 32) {
    throw new Error('Invalid AES key length; expected 32 bytes (256-bit)');
  }
  return buf;
}

// Matches Python: AES-256-CBC with IV = first 16 bytes of key, PKCS#7 padding, Base64 output
function aesEncryptBase64(plaintext: string, keyStr: string): string {
  const key = ensureKey32Bytes(keyStr);
  const iv = key.subarray(0, 16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  return enc.toString('base64');
}

// Optional decryption (if needed later)
function _aesDecryptBase64ToString(ciphertextB64: string, keyStr: string): string {
  const key = ensureKey32Bytes(keyStr);
  const iv = key.subarray(0, 16);
  // Add Base64 padding if needed
  const padded = ciphertextB64 + '='.repeat((4 - (ciphertextB64.length % 4)) % 4);
  const data = Buffer.from(padded, 'base64');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

// SHA-512 hex digest of "client_id|field1|...|fieldN|client_secret"
function buildHashPipeSeparated(data: Record<string, any>, clientId: string, clientSecret: string): string {
  const crypto = require('crypto');
  const values = Object.values(data).map((v) => (v === undefined || v === null ? '' : String(v)));
  const concatenated = `${clientId}|${values.join('|')}|${clientSecret}`;
  const hashHex = crypto.createHash('sha512').update(concatenated).digest('hex');
  return hashHex;
}

/**
 * POST /api/payment-webhook
 * Handles incoming payment notifications
 * 
 * Expected request body:
 * {
 *   "phone_number": "+91XXXXXXXXXX",
 *   "amount": 100,
 *   "transactionId": "txn_123456",
 *   "status": "success"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Phone number +91XXXXXXXXXX received",
 *   "phoneNumber": "+91XXXXXXXXXX",
 *   "timestamp": "2025-10-24T10:30:00.000Z"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Payment Webhook] POST request received');

    // Prepare to parse body with support for both text/plain and JSON
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    let payload: PaymentWebhookRequest | string | undefined;
    if (contentType.includes('text/plain')) {
      const raw = (await request.text());
      const rawNorm = raw.trim().toLowerCase();
      if (rawNorm === 'hi') {
        return new NextResponse(' hello ', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      // Try to parse text as JSON (common in tests/clients that omit JSON header)
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        console.error('[Payment Webhook] Failed to parse JSON from text/plain:', e);
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid JSON in request body',
            error: 'INVALID_JSON',
          },
          { status: 400 }
        );
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await request.text();
      const params = new URLSearchParams(raw);
      const msgParam = params.get('message') || params.get('msg');
      if ((msgParam || '').trim().toLowerCase() === 'hi') {
        return new NextResponse(' hello ', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      // Build a payload object from form fields if present
      payload = {
        phone_number: params.get('phone_number') || undefined,
        phoneNumber: params.get('phoneNumber') || undefined,
        amount: params.get('amount') ? Number(params.get('amount')) : undefined,
        transactionId: params.get('transactionId') || undefined,
        status: params.get('status') || undefined,
        timestamp: params.get('timestamp') || undefined,
      } as PaymentWebhookRequest;
    } else {
      // Parse request body as JSON
      try {
        const parsed = await request.json();
        payload = parsed;
        console.log('[Payment Webhook] Request payload:', {
          phoneNumber: (parsed as any)?.phone_number || (parsed as any)?.phoneNumber,
          amount: (parsed as any)?.amount,
          transactionId: (parsed as any)?.transactionId,
          status: (parsed as any)?.status,
        });
      } catch (parseError) {
        console.error('[Payment Webhook] Failed to parse JSON:', parseError);
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid JSON in request body',
            error: 'INVALID_JSON',
          },
          { status: 400 }
        );
      }
    }

    // Echo shortcut for JSON payloads
    if (typeof payload === 'string') {
      if (payload.trim().toLowerCase() === 'hi') {
        return new NextResponse(' hello ', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      // if it's a string but not 'hi', treat as invalid JSON shape
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON in request body',
          error: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    const rawMsg =
      (payload as any)?.message ??
      (payload as any)?.msg ??
      (payload as any)?.text ??
      (payload as any)?.body;
    if (typeof rawMsg === 'string' && rawMsg.trim().toLowerCase() === 'hi') {
      return new NextResponse(' hello ', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Safety: ensure payload exists before proceeding
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON in request body',
          error: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    // Extract phone number (support both snake_case and camelCase)
    // Be permissive: coerce numbers to string and trim whitespace
    const rawPhone: any = (payload as any).phone_number ?? (payload as any).phoneNumber;
    let phoneNumber: string | undefined =
      rawPhone === undefined || rawPhone === null
        ? undefined
        : (typeof rawPhone === 'string' ? rawPhone : String(rawPhone)).trim();
    // Normalize: remove spaces, dashes, parentheses, collapse leading 00 to +, preserve leading + if present
    if (phoneNumber) {
      const hadPlus = phoneNumber.startsWith('+');
      // Remove spaces, dashes, parentheses, and any '+' signs; we'll re-add a single leading plus if needed
      let normalized = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
      if (normalized.startsWith('00')) {
        normalized = '+' + normalized.slice(2);
      } else if (hadPlus) {
        normalized = '+' + normalized;
      }
      phoneNumber = normalized;
    }

    // Validate phone number
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.warn('[Payment Webhook] Missing or invalid phone_number. Raw value:', rawPhone);
      return NextResponse.json(
        {
          success: false,
          message: 'Phone number is required and must be a string',
          error: 'MISSING_PHONE_NUMBER',
        },
        { status: 400 }
      );
    }

    // Validate phone number by digits count: accept if 10+ digits after stripping non-digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    console.log('[Payment Webhook] Normalized phone before validation:', phoneNumber, 'digits:', digitsOnly.length);
    if (digitsOnly.length < 10) {
      console.warn('[Payment Webhook] Invalid phone number format (digits < 10):', phoneNumber, '-> digits:', digitsOnly.length);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid phone number format',
          error: 'INVALID_PHONE_FORMAT',
        },
        { status: 400 }
      );
    }
    console.log('[Payment Webhook] Phone validation passed (digits >= 10)');

    // If forwarding is enabled, build the external request and send
    const forwardFlagPrimaryRaw = getEnv('PAYMENT_WEBHOOK_FORWARD_ENABLED');
    const forwardFlagSecondaryRaw = getEnv('PL_FORWARD_ENABLED');
    const forwardFlagEffective = forwardFlagPrimaryRaw ?? forwardFlagSecondaryRaw;
    const forwardEnabled = forwardFlagEffective === 'true';
    console.log('[Payment Webhook] Forwarding flags resolved:', {
      PAYMENT_WEBHOOK_FORWARD_ENABLED: forwardFlagPrimaryRaw ?? null,
      PL_FORWARD_ENABLED: forwardFlagSecondaryRaw ?? null,
      forwardEnabled,
    });
    if (forwardEnabled) {
      try {
        const apiUrl = getEnv('PL_API_URL');
        const aesKey = getEnv('PL_AES_KEY');
        const xBizToken = getEnv('PL_X_BIZ_TOKEN');
        console.log('[Payment Webhook] Forwarding env presence:', {
          hasApiUrl: !!apiUrl,
          hasAesKey: !!aesKey,
          hasXBizToken: !!xBizToken,
        });
        if (!apiUrl || !aesKey || !xBizToken) {
          const missingEnvs: string[] = [];
          if (!apiUrl) missingEnvs.push('PL_API_URL');
          if (!aesKey) missingEnvs.push('PL_AES_KEY');
          if (!xBizToken) missingEnvs.push('PL_X_BIZ_TOKEN');
          console.error('[Payment Webhook] Missing forwarding env:', missingEnvs.join(', ') || 'unknown');
          return NextResponse.json(
            { success: false, error: 'CONFIG_MISSING', message: 'Forwarding configuration missing' },
            { status: 500 }
          );
        }

        // Compose request_body similar to the Python script structure
        // Required at minimum: phone_number; others optional/defaults
        const payloadObj = payload as Record<string, any>;
        const notificationChannel = {
          ...DEFAULT_FORWARDING_VALUES.notification_channel,
          ...(asPlainObject(payloadObj?.notification_channel) || {}),
        };
        const customField = {
          ...DEFAULT_FORWARDING_VALUES.custom_field,
          ...(asPlainObject(payloadObj?.custom_field) || {}),
        };

        // Resolve template and lang code from incoming templateID (supports multiple casings)
        const incomingTemplateID =
          payloadObj?.templateID ?? payloadObj?.templateId ?? payloadObj?.template_id;
        const { template_name, pref_lang_code } = resolveTemplateAndLang(incomingTemplateID);
        console.log('[Payment Webhook] Resolved template and lang:', {
          incomingTemplateID: incomingTemplateID || 'none',
          template_name,
          pref_lang_code,
        });

        const requestBody: Record<string, any> = {
          phone_number: phoneNumber.replace(/^\+91/, ''),
          email: payloadObj?.email || DEFAULT_FORWARDING_VALUES.email,
          full_name: payloadObj?.full_name || DEFAULT_FORWARDING_VALUES.full_name,
          amount: resolvePositiveAmount(payloadObj?.dueAmount ?? payloadObj?.amount),
          due_date: resolveDueDate(
            payloadObj?.due_date,
            DEFAULT_FORWARDING_VALUES.due_date_offset_days
          ),
          account_id: payloadObj?.account_id || DEFAULT_FORWARDING_VALUES.account_id,
          send_notification:
            typeof payloadObj?.send_notification === 'boolean'
              ? payloadObj.send_notification
              : DEFAULT_FORWARDING_VALUES.send_notification,
          template_name,
          merchant_reference_number:
            payloadObj?.merchant_reference_number ?? DEFAULT_FORWARDING_VALUES.merchant_reference_number,
          pref_lang_code,
          notification_channel: notificationChannel,
          custom_field: customField,
        };

        // Optional hashing support (matches Python GenerateHashForAPI)
        const useHash = (getEnv('PL_USE_HASH') || '').toLowerCase() === 'true';
        if (useHash) {
          const cid = getEnv('PL_CLIENT_ID');
          const csec = getEnv('PL_CLIENT_SECRET');
          console.log('[Payment Webhook] Hashing enabled. Credential presence:', {
            hasClientId: !!cid,
            hasClientSecret: !!csec,
          });
          if (!cid || !csec) {
            console.error('[Payment Webhook] Hashing enabled but PL_CLIENT_ID/PL_CLIENT_SECRET missing');
            return NextResponse.json(
              { success: false, error: 'CONFIG_MISSING', message: 'Client credentials missing for hash' },
              { status: 500 }
            );
          }

          // Hash order must match Python dict population order
          const dictDataOrdered: Record<string, any> = {
            phone_number: requestBody.phone_number,
            email: requestBody.email,
            full_name: requestBody.full_name,
            amount: requestBody.amount,
            due_date: requestBody.due_date,
            account_id: requestBody.account_id,
            send_notification: requestBody.send_notification,
            template_name: requestBody.template_name,
            merchant_reference_number: requestBody.merchant_reference_number,
            pref_lang_code: requestBody.pref_lang_code,
          };

          const ch = requestBody.notification_channel || {};
          if (ch && Object.keys(ch).length > 0) {
            dictDataOrdered['whatsapp'] = ch.whatsapp ?? '';
            dictDataOrdered['whatsappOD'] = ch.whatsappOD ?? '';
            if (ch.whatsappUPIINTENT) {
              dictDataOrdered['whatsappUPIINTENT'] = ch.whatsappUPIINTENT;
            }
            dictDataOrdered['sms'] = ch.sms ?? '';
            dictDataOrdered['notification_email'] = ch.email ?? '';
          }

          const cf = requestBody.custom_field || {};
          dictDataOrdered['custom_field1'] = cf.custom_field1 ?? '';
          dictDataOrdered['custom_field2'] = cf.custom_field2 ?? '';
          dictDataOrdered['custom_field3'] = cf.custom_field3 ?? '';
          dictDataOrdered['custom_field4'] = cf.custom_field4 ?? '';
          dictDataOrdered['custom_field5'] = cf.custom_field5 ?? '';
          dictDataOrdered['custom_field6'] = cf.custom_field6 ?? '';
          dictDataOrdered['custom_field7'] = cf.custom_field7 ?? '';
          dictDataOrdered['custom_field8'] = cf.custom_field8 ?? '';

          const hex = buildHashPipeSeparated(dictDataOrdered, cid, csec);
          requestBody['hash'] = hex;
        }

        const plaintext = JSON.stringify(requestBody);
        const encrypted = aesEncryptBase64(plaintext, aesKey);
        console.log('[Payment Webhook] Forwarding payload preview:', {
          phone_number: requestBody.phone_number,
          amount: requestBody.amount,
          due_date: requestBody.due_date,
          merchant_reference_number: requestBody.merchant_reference_number,
          send_notification: requestBody.send_notification,
          useHash,
        });

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'X-Biz-Token': xBizToken,
            'Content-Type': 'application/json',
          },
          body: encrypted,
        });
        console.log('[Payment Webhook] Forward response received:', {
          status: res.status,
          ok: res.ok,
        });

        // Try to parse JSON, else return text
        const text = await res.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { raw: text };
        }

        return NextResponse.json(
          {
            success: res.ok,
            forwarded: true,
            status: res.status,
            data: parsed,
          },
          { status: res.ok ? 200 : res.status }
        );
      } catch (e) {
        console.error('[Payment Webhook] Forwarding error:', e);
        if (e instanceof Error && e.stack) {
          console.error('[Payment Webhook] Forwarding error stack:', e.stack);
        }
        return NextResponse.json(
          { success: false, forwarded: true, error: 'FORWARD_FAILED' },
          { status: 502 }
        );
      }
    }
    console.log('[Payment Webhook] Forwarding disabled or flag not true. Returning local acknowledgment.');

    // Default: local acknowledgment response (tests rely on this)
    const timestamp = new Date().toISOString();
    console.log('[Payment Webhook] Successfully received payment notification');
    console.log('[Payment Webhook] Phone number received:', phoneNumber);
    console.log('[Payment Webhook] Timestamp:', timestamp);
    if (payload && payload.transactionId) {
      console.log('[Payment Webhook] Transaction ID:', payload.transactionId);
    }
    console.log('[Payment Webhook] Returning 200 local acknowledgement response');

    const response: PaymentWebhookResponse = {
      success: true,
      message: `Phone number ${phoneNumber} received`,
      phoneNumber,
      timestamp,
    };
    if (payload && payload.transactionId) response.transactionId = payload.transactionId;
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Payment Webhook] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment-webhook
 * Health check endpoint
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  console.log('[Payment Webhook] GET request received - Health check');

  // If a message query param is provided and equals 'hi', echo back " hello " as plain text
  try {
    const url = new URL(_request.url);
    const msg = url.searchParams.get('message') || url.searchParams.get('msg');
    if ((msg || '').trim().toLowerCase() === 'hi') {
      return new NextResponse(' hello ', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch {
    // ignore URL parse errors and fall through to default JSON response
  }

  return NextResponse.json(
    {
      service: 'Payment Webhook Handler',
      status: 'operational',
      version: '1.0.0',
      endpoints: {
        post: 'POST /api/payment-webhook - Accept payment notifications with phone number',
      },
    },
    { status: 200 }
  );
}
