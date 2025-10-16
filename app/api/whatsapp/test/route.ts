import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/whatsapp/test
 * Send a test message "hi check" to verify WhatsApp configuration
 */
export async function POST(request: NextRequest) {
    try {
        const { accessToken, phoneNumberId, recipientPhone } = await request.json();

        if (!accessToken || !phoneNumberId || !recipientPhone) {
            return NextResponse.json(
                { error: 'Missing required fields: accessToken, phoneNumberId, recipientPhone' },
                { status: 400 }
            );
        }

        console.log('[WhatsApp Test] Sending test message to:', recipientPhone);

        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: recipientPhone,
                type: 'text',
                text: {
                    body: 'hi check',
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[WhatsApp Test] Failed:', data);
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Failed to send test message',
                    details: data 
                },
                { status: response.status }
            );
        }

        console.log('[WhatsApp Test] Success:', data);

        return NextResponse.json({
            success: true,
            message: 'Test message "hi check" sent successfully',
            data,
        });

    } catch (error) {
        console.error('[WhatsApp Test] Error:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to send test message',
                details: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}
