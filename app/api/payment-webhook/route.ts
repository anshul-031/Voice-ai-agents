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

    // Parse request body
    let payload: PaymentWebhookRequest;
    try {
      payload = await request.json();
      console.log('[Payment Webhook] Request payload:', {
        phoneNumber: payload.phone_number || payload.phoneNumber,
        amount: payload.amount,
        transactionId: payload.transactionId,
        status: payload.status,
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
    if (payload.transactionId) {
      console.log('[Payment Webhook] Transaction ID:', payload.transactionId);
    }

    // Prepare response
    const response: PaymentWebhookResponse = {
      success: true,
      message: `Phone number ${phoneNumber} received`,
      phoneNumber,
      timestamp,
    };

    if (payload.transactionId) {
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
