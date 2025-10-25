/**
 * Payment Webhook Handler
 * Receives payment notifications with phone number
 * and sends acknowledgment responses
 */

import { NextRequest, NextResponse } from 'next/server';

interface PaymentWebhookRequest {
  phone_number?: string;
  phoneNumber?: string;
  amount?: number;
  transactionId?: string;
  status?: string;
  timestamp?: string;
}

interface PaymentWebhookResponse {
  success: boolean;
  message: string;
  phoneNumber: string;
  timestamp: string;
  transactionId?: string;
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
  const phoneNumber = payload.phone_number || payload.phoneNumber;

    // Validate phone number
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.warn('[Payment Webhook] Missing or invalid phone_number');
      return NextResponse.json(
        {
          success: false,
          message: 'Phone number is required and must be a string',
          error: 'MISSING_PHONE_NUMBER',
        },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.warn('[Payment Webhook] Invalid phone number format:', phoneNumber);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid phone number format',
          error: 'INVALID_PHONE_FORMAT',
        },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Log successful webhook receipt
    console.log('[Payment Webhook] Successfully received payment notification');
    console.log('[Payment Webhook] Phone number received:', phoneNumber);
    console.log('[Payment Webhook] Timestamp:', timestamp);
    if (payload && payload.transactionId) {
      console.log('[Payment Webhook] Transaction ID:', payload.transactionId);
    }

    // Prepare response
    const response: PaymentWebhookResponse = {
      success: true,
      message: `Phone number ${phoneNumber} received`,
      phoneNumber,
      timestamp,
    };

    if (payload && payload.transactionId) {
      response.transactionId = payload.transactionId;
    }

    console.log('[Payment Webhook] Sending acknowledgment response');
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
