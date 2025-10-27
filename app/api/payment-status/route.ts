/**
 * Payment Status API
 * Returns the status of a payment transaction
 */

import { NextRequest, NextResponse } from 'next/server';

interface PaymentStatusResponse {
  success: boolean;
  transactionId: string;
  status: 'successful' | 'failed' | 'pending' | 'processing';
  message: string;
  reason?: string;
  timestamp: string;
  amount?: number;
  phoneNumber?: string;
}

/**
 * GET /api/payment-status?transactionId=txn_123456
 * Returns the status of a payment transaction
 *
 * Query parameters:
 * - transactionId: The transaction ID to check (required)
 *
 * Response:
 * {
 *   "success": true,
 *   "transactionId": "txn_123456",
 *   "status": "successful",
 *   "message": "Payment processed successfully",
 *   "timestamp": "2025-10-27T10:30:00.000Z",
 *   "amount": 100,
 *   "phoneNumber": "+91XXXXXXXXXX"
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Payment Status] GET request received');

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');

    if (!transactionId || transactionId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction ID is required',
          error: 'MISSING_TRANSACTION_ID',
        },
        { status: 400 }
      );
    }

    // In a real implementation, this would query a database or external payment system
    // For now, we'll simulate payment status based on transaction ID
    const statusData = getPaymentStatus(transactionId.trim());

    console.log('[Payment Status] Status lookup for transaction:', transactionId, '->', statusData.status);

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
function getPaymentStatus(transactionId: string): PaymentStatusResponse {
  const timestamp = new Date().toISOString();

  // Simulate different statuses based on transaction ID patterns
  if (transactionId.includes('success') || transactionId.startsWith('txn_success')) {
    return {
      success: true,
      transactionId,
      status: 'successful',
      message: 'Payment processed successfully',
      timestamp,
      amount: 100,
      phoneNumber: '+91XXXXXXXXXX',
    };
  }

  if (transactionId.includes('fail') || transactionId.startsWith('txn_fail')) {
    return {
      success: true,
      transactionId,
      status: 'failed',
      message: 'Payment failed',
      reason: 'Insufficient funds',
      timestamp,
      amount: 50,
      phoneNumber: '+91YYYYYYYYYY',
    };
  }

  if (transactionId.includes('pending') || transactionId.startsWith('txn_pending')) {
    return {
      success: true,
      transactionId,
      status: 'pending',
      message: 'Payment is being processed',
      timestamp,
      amount: 75,
      phoneNumber: '+91ZZZZZZZZZZ',
    };
  }

  if (transactionId.includes('processing') || transactionId.startsWith('txn_processing')) {
    return {
      success: true,
      transactionId,
      status: 'processing',
      message: 'Payment is currently being processed',
      timestamp,
      amount: 200,
      phoneNumber: '+91AAAAAAAAAA',
    };
  }

  // Default: assume successful for demo purposes
  // In production, you'd return 'not_found' or check actual records
  return {
    success: true,
    transactionId,
    status: 'successful',
    message: 'Payment processed successfully',
    timestamp,
    amount: Math.floor(Math.random() * 1000) + 1,
    phoneNumber: '+91XXXXXXXXXX',
  };
}