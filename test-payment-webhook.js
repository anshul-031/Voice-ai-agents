/**
 * Test script for payment webhook API
 * Tests with phone number 9953969666 and dueAmount 3000
 */

const testPaymentWebhook = async () => {
  const url = 'http://localhost:3000/api/payment-webhook';
  
  const payload = {
    phone_number: '9953969666',
    dueAmount: 3000,
    transactionId: 'test_txn_001',
    status: 'pending'
  };

  console.log('🔄 Testing Payment Webhook API');
  console.log('📍 Endpoint:', url);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n---\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('✅ Response Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📥 Response Data:', JSON.stringify(data, null, 2));

    // Verify the response
    console.log('\n--- Verification ---');
    console.log('✓ Success:', data.success);
    console.log('✓ Phone Number:', data.phoneNumber);
    console.log('✓ Message:', data.message);
    console.log('✓ Transaction ID:', data.transactionId);
    console.log('✓ Timestamp:', data.timestamp);

    if (data.forwarded) {
      console.log('✓ Forwarded to external API:', data.forwarded);
      console.log('✓ External API Status:', data.status);
      console.log('✓ External API Response:', JSON.stringify(data.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
  }
};

// Run the test
testPaymentWebhook();
