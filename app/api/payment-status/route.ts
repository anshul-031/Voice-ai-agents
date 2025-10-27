/**
 * Payment Status API
 * Returns the status of a payment transaction and handles payment gateway callbacks
 */

import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { NextRequest, NextResponse } from 'next/server';

// Fallback in-memory storage when MongoDB is not available
const paymentStore = new Map<string, any>();

interface PaymentData {
  transaction_id: string;
  mer_ref_id?: string;
  account_id?: string;
  payment_status: 'successful' | 'failed' | 'pending' | 'processing';
  payment_date: string;
  description: string;
  amount?: number;
}

/**
 * GET /api/payment-status?transaction_id=txn_123&mer_ref_id=ref_456&account_id=acc_789
 * Returns the status of a payment transaction
 *
 * Query parameters:
 * - transaction_id: Payment Transaction Id
 * - mer_ref_id: Reference Id
 * - account_id: Account Id (Customer Id)
 * - payment_status: Payment Status (optional filter)
 * - payment_date: Payment Date (optional filter)
 * - description: Description (optional filter)
 *
 * Response:
 * {
 *   "status_code": 200,
 *   "message": "Payment status retrieved successfully",
 *   "data": {
 *     "transaction_id": "txn_123",
 *     "mer_ref_id": "ref_456",
 *     "account_id": "acc_789",
 *     "payment_status": "successful",
 *     "payment_date": "2025-10-27T10:30:00.000Z",
 *     "description": "Payment processed successfully",
 *     "amount": 100
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Payment Status] GET request received');

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transaction_id');
    const merRefId = url.searchParams.get('mer_ref_id');
    const accountId = url.searchParams.get('account_id');
    const _paymentStatus = url.searchParams.get('payment_status'); // Optional filter
    const _paymentDate = url.searchParams.get('payment_date'); // Optional filter
    const _description = url.searchParams.get('description'); // Optional filter

    // At least one identifier is required
    if ((!transactionId || transactionId.trim().length === 0) &&
        (!merRefId || merRefId.trim().length === 0) &&
        (!accountId || accountId.trim().length === 0)) {
      return NextResponse.json(
        {
          status_code: 400,
          message: 'At least one identifier (transaction_id, mer_ref_id, or account_id) is required',
        },
        { status: 400 }
      );
    }

    // Connect to database (optional - will use in-memory fallback if not available)
    const dbConnection = await dbConnect();
    if (dbConnection) {
      console.log('[Payment Status] Connected to MongoDB');
    } else {
      console.log('[Payment Status] Using in-memory storage (MongoDB not configured)');
    }

    // Find payment data by any of the identifiers
    const paymentData = await findPaymentData(transactionId?.trim(), merRefId?.trim(), accountId?.trim());

    if (!paymentData) {
      return NextResponse.json(
        {
          status_code: 404,
          message: 'Payment data not found',
        },
        { status: 404 }
      );
    }

    console.log('[Payment Status] Status lookup completed:', {
      transaction_id: transactionId?.trim(),
      mer_ref_id: merRefId?.trim(),
      account_id: accountId?.trim(),
      payment_status: paymentData.payment_status
    });

    return NextResponse.json({
      status_code: 200,
      message: 'Payment status retrieved successfully',
      data: {
        transaction_id: paymentData.transaction_id,
        mer_ref_id: paymentData.mer_ref_id,
        account_id: paymentData.account_id,
        payment_status: paymentData.payment_status,
        payment_date: new Date(paymentData.payment_date as unknown as string | Date).toISOString(),
        description: paymentData.description,
        amount: paymentData.amount,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[Payment Status] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status_code: 500,
        message: 'Internal server error',
        data: { error: errorMessage }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payment-status
 * Stores payment data from payment gateway callback
 *
 * Request Body:
 * {
 *   "transaction_id": "txn_123",
 *   "mer_ref_id": "ref_456",
 *   "account_id": "acc_789",
 *   "payment_status": "successful",
 *   "payment_date": "2025-10-27T10:30:00.000Z",
 *   "description": "Payment processed successfully",
 *   "amount": 100
 * }
 *
 * Response:
 * {
 *   "status_code": 201,
 *   "message": "Payment data stored successfully"
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[Payment Status] POST request received');

    const body: PaymentData = await request.json();

    // Validate required fields
    if (!body.transaction_id || !body.payment_status || !body.payment_date || !body.description) {
      return NextResponse.json(
        {
          status_code: 400,
          message: 'Missing required fields: transaction_id, payment_status, payment_date, description',
        },
        { status: 400 }
      );
    }

    // Validate payment_status
    const validStatuses = ['successful', 'failed', 'pending', 'processing'];
    if (!validStatuses.includes(body.payment_status)) {
      return NextResponse.json(
        {
          status_code: 400,
          message: 'Invalid payment_status. Must be one of: successful, failed, pending, processing',
        },
        { status: 400 }
      );
    }

    // Connect to database (optional - will use in-memory fallback if not available)
    const dbConnection = await dbConnect();

    // Prepare payment data
    const paymentData = {
      transaction_id: body.transaction_id,
      mer_ref_id: body.mer_ref_id,
      account_id: body.account_id,
      payment_status: body.payment_status,
      payment_date: new Date(body.payment_date),
      description: body.description,
      amount: body.amount,
    };

    if (dbConnection) {
      // Store payment data in MongoDB
      console.log('[Payment Status] Storing in MongoDB');
      await Payment.findOneAndUpdate(
        { transaction_id: body.transaction_id },
        paymentData,
        { upsert: true, new: true }
      );
    } else {
      // Store payment data in memory
      console.log('[Payment Status] Storing in memory (MongoDB not configured)');
      paymentStore.set(body.transaction_id, {
        transaction_id: body.transaction_id,
        mer_ref_id: body.mer_ref_id,
        account_id: body.account_id,
        payment_status: body.payment_status,
        payment_date: new Date(body.payment_date),
        description: body.description,
        amount: body.amount,
      });
    }

    console.log('[Payment Status] Payment data stored:', {
      transaction_id: body.transaction_id,
      payment_status: body.payment_status
    });

    return NextResponse.json(
      {
        status_code: 201,
        message: 'Payment data stored successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Payment Status] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        status_code: 500,
        message: 'Internal server error',
        data: { error: errorMessage }
      },
      { status: 500 }
    );
  }
}

/**
 * Find payment data by any of the identifiers
 */
async function findPaymentData(transactionId?: string, merRefId?: string, accountId?: string): Promise<PaymentData | null> {
  // Check if MongoDB is available
  const dbConnection = await dbConnect();

  if (!dbConnection) {
    // Use in-memory storage as fallback
    console.log('[Payment Status] Using in-memory storage (MongoDB not available)');

    // First try to find by transaction_id (most specific)
    if (transactionId && paymentStore.has(transactionId)) {
      return paymentStore.get(transactionId);
    }

    // Then try to find by mer_ref_id
    if (merRefId) {
      for (const payment of paymentStore.values()) {
        if (payment.mer_ref_id === merRefId) {
          return payment;
        }
      }
    }

    // Finally try to find by account_id
    if (accountId) {
      for (const payment of paymentStore.values()) {
        if (payment.account_id === accountId) {
          return payment;
        }
      }
    }

    return null;
  }

  // Use MongoDB
  console.log('[Payment Status] Using MongoDB storage');

  // First try to find by transaction_id (most specific)
  if (transactionId) {
    const payment = await Payment.findOne({ transaction_id: transactionId });
    if (payment) {
      return {
        transaction_id: payment.transaction_id,
        mer_ref_id: payment.mer_ref_id,
        account_id: payment.account_id,
        payment_status: payment.payment_status,
        payment_date: payment.payment_date,
        description: payment.description,
        amount: payment.amount,
      };
    }
  }

  // Then try to find by mer_ref_id
  if (merRefId) {
    const payment = await Payment.findOne({ mer_ref_id: merRefId });
    if (payment) {
      return {
        transaction_id: payment.transaction_id,
        mer_ref_id: payment.mer_ref_id,
        account_id: payment.account_id,
        payment_status: payment.payment_status,
        payment_date: payment.payment_date,
        description: payment.description,
        amount: payment.amount,
      };
    }
  }

  // Finally try to find by account_id
  if (accountId) {
    const payment = await Payment.findOne({ account_id: accountId });
    if (payment) {
      return {
        transaction_id: payment.transaction_id,
        mer_ref_id: payment.mer_ref_id,
        account_id: payment.account_id,
        payment_status: payment.payment_status,
        payment_date: payment.payment_date,
        description: payment.description,
        amount: payment.amount,
      };
    }
  }

  return null;
}