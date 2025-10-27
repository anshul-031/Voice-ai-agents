/**
 * Payment Status API
 * Returns the status of a payment transaction
 */

import { NextRequest, NextResponse } from 'next/server';

interface PaymentStatusResponse {
  success: boolean;
  transactionId?: string;
  phoneNumber?: string;
  status: 'successful' | 'failed' | 'pending' | 'processing';
  message: string;
  reason?: string;
  timestamp: string;
  amount?: number;
}

/**
 * GET /api/payment-status?transactionId=txn_123456&phoneNumber=+91XXXXXXXXXX
 * Returns the status of a payment transaction
 *
 * Query parameters (provide at least one):
 * - transactionId: The transaction ID to check
 * - phoneNumber: The phone number to check (supports both +91XXXXXXXXXX and XXXXXXXXXX formats)
 *
 * Response:
 * {
 *   "success": true,
 *   "transactionId": "txn_123456",
 *   "phoneNumber": "+91XXXXXXXXXX",
 *   "status": "successful",
 *   "message": "Payment processed successfully",
 *   "timestamp": "2025-10-27T10:30:00.000Z",
 *   "amount": 100
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Payment Status] GET request received');

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');
    const phoneNumberParam = url.searchParams.get('phoneNumber');

    // Normalize phone number if provided (similar to webhook logic)
    let normalizedPhoneNumber: string | undefined;
    if (phoneNumberParam) {
      let phone = phoneNumberParam.trim();
      // Remove spaces, dashes, parentheses, and any '+' signs; we'll re-add a single leading plus
      let normalized = phone.replace(/[\s\-\(\)\+]/g, '');
      if (normalized.startsWith('00')) {
        normalized = '+' + normalized.slice(2);
      } else {
        // Always add + prefix for consistency
        normalized = '+' + normalized;
      }
      normalizedPhoneNumber = normalized;
    }

    if ((!transactionId || transactionId.trim().length === 0) && (!normalizedPhoneNumber || normalizedPhoneNumber.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either transactionId or phoneNumber is required',
          error: 'MISSING_PARAMETERS',
        },
        { status: 400 }
      );
    }

    // In a real implementation, this would query a database or external payment system
    // For now, we'll simulate payment status lookup
    const statusData = getPaymentStatus(transactionId?.trim(), normalizedPhoneNumber);

    console.log('[Payment Status] Status lookup completed:', {
      transactionId: transactionId?.trim(),
      phoneNumber: normalizedPhoneNumber,
      status: statusData.status
    });

    return NextResponse.json(statusData, { status: 200 });
  } catch (error) {
    console.error('[Payment Status] Unexpected error:', error);
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
 * Mock function to simulate payment status lookup
 * In production, this would query your payment database or external payment provider
 */
function getPaymentStatus(transactionId?: string, phoneNumber?: string): PaymentStatusResponse {
  const timestamp = new Date().toISOString();

  // Determine lookup key (prefer transactionId if available, otherwise use phoneNumber)
  const lookupKey = transactionId || phoneNumber || '';

  // Simulate different statuses based on lookup key patterns
  if (lookupKey.includes('success') || lookupKey.startsWith('txn_success')) {
    return {
      success: true,
      transactionId: transactionId || 'txn_auto_generated',
      phoneNumber: transactionId ? '+91XXXXXXXXXX' : (phoneNumber || '+91XXXXXXXXXX'),
      status: 'successful',
      message: 'Payment processed successfully',
      timestamp,
      amount: 100,
    };
  }

  if (lookupKey.includes('fail') || lookupKey.startsWith('txn_fail')) {
    return {
      success: true,
      transactionId: transactionId || 'txn_auto_generated',
      phoneNumber: transactionId ? '+91YYYYYYYYYY' : (phoneNumber || '+91YYYYYYYYYY'),
      status: 'failed',
      message: 'Payment failed',
      reason: 'Insufficient funds',
      timestamp,
      amount: 50,
    };
  }

  if (lookupKey.includes('pending') || lookupKey.startsWith('txn_pending')) {
    return {
      success: true,
      transactionId: transactionId || 'txn_auto_generated',
      phoneNumber: transactionId ? '+91ZZZZZZZZZZ' : (phoneNumber || '+91ZZZZZZZZZZ'),
      status: 'pending',
      message: 'Payment is being processed',
      timestamp,
      amount: 75,
    };
  }

  if (lookupKey.includes('processing') || lookupKey.startsWith('txn_processing')) {
    return {
      success: true,
      transactionId: transactionId || 'txn_auto_generated',
      phoneNumber: transactionId ? '+91AAAAAAAAAA' : (phoneNumber || '+91AAAAAAAAAA'),
      status: 'processing',
      message: 'Payment is currently being processed',
      timestamp,
      amount: 200,
    };
  }

  // Default: assume successful for demo purposes
  // In production, you'd return 'not_found' or check actual records
  return {
    success: true,
    transactionId: transactionId || 'txn_auto_generated',
    phoneNumber: transactionId ? '+91XXXXXXXXXX' : (phoneNumber || '+91XXXXXXXXXX'),
    status: 'successful',
    message: 'Payment processed successfully',
    timestamp,
    amount: Math.floor(Math.random() * 1000) + 1,
  };
}