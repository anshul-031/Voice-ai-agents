import { type NextRequest, NextResponse } from 'next/server';

interface WhatsAppRequest {
  phoneNumber: string;
}

interface WhatsAppResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0/788971100971297/messages';

export async function POST(request: NextRequest): Promise<NextResponse<WhatsAppResponse>> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[WhatsApp Webhook] [${requestId}] POST request received`);

    try {
        // Validate token existence
        const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
        console.log(`[WhatsApp Webhook] [${requestId}] Token validation: ${WHATSAPP_TOKEN ? 'Present' : 'Missing'}`);

        if (!WHATSAPP_TOKEN) {
            console.error(`[WhatsApp Webhook] [${requestId}] ERROR: WhatsApp token not configured`);
            return NextResponse.json(
                {
                    success: false,
                    message: 'WhatsApp token not configured',
                    error: 'Missing configuration',
                },
                { status: 500 },
            );
        }

        // Parse and validate request body
        let body: WhatsAppRequest;
        try {
            body = await request.json();
            console.log(`[WhatsApp Webhook] [${requestId}] Request body parsed:`, JSON.stringify(body));
        } catch (parseError) {
            console.error(`[WhatsApp Webhook] [${requestId}] ERROR: Failed to parse request body:`, parseError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid request body',
                    error: 'Request body must be valid JSON',
                },
                { status: 400 },
            );
        }

        // Validate phone number
        const { phoneNumber } = body;
        console.log(`[WhatsApp Webhook] [${requestId}] Original phone number: ${phoneNumber || 'NOT PROVIDED'}`);

        if (!phoneNumber) {
            console.error(`[WhatsApp Webhook] [${requestId}] ERROR: Phone number missing in request`);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Phone number is required',
                    error: 'Missing phoneNumber field',
                },
                { status: 400 },
            );
        }

        // Remove '+' prefix if present and validate
        const cleanPhoneNumber = phoneNumber.replace(/^\+/, '');
        console.log(`[WhatsApp Webhook] [${requestId}] Cleaned phone number: ${cleanPhoneNumber}`);

        // Basic phone number validation (should be 10-15 digits with country code)
        const phoneRegex = /^\d{10,15}$/;
        if (!phoneRegex.test(cleanPhoneNumber)) {
            console.error(`[WhatsApp Webhook] [${requestId}] ERROR: Invalid phone format - ${cleanPhoneNumber}`);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid phone number format',
                    error: 'Phone number should be 10-15 digits with country code (e.g., 919953969666 or +919953969666)',
                },
                { status: 400 },
            );
        }

        console.log(`[WhatsApp Webhook] [${requestId}] Phone number validated successfully`);
        console.log(`[WhatsApp Webhook] [${requestId}] Phone number validated successfully`);

        // Prepare WhatsApp API request payload
        const whatsappPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhoneNumber,
            type: 'template',
            template: {
                name: 'pl_across_assist_demo_3',
                language: {
                    code: 'en_US',
                },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: '2447',
                            },
                            {
                                type: 'text',
                                text: '2447',
                            },
                            {
                                type: 'text',
                                text: 'Engine Failure',
                            },
                            {
                                type: 'text',
                                text: 'Hyundai Creta',
                            },
                            {
                                type: 'text',
                                text: 'Towing',
                            },
                            {
                                type: 'text',
                                text: 'Sector 45, Gurgaon',
                            },
                            {
                                type: 'text',
                                text: 'Hyundai Service Center, MG Road',
                            },
                            {
                                type: 'text',
                                text: '18 km',
                            },
                            {
                                type: 'text',
                                text: '+91 9808494950',
                            },
                            {
                                type: 'text',
                                text: '25 minutes',
                            },
                        ],
                    },
                ],
            },
        };

        console.log(`[WhatsApp Webhook] [${requestId}] Payload prepared for API:`, JSON.stringify({
            ...whatsappPayload,
            template: {
                ...whatsappPayload.template,
                components: '[10 parameters]',
            },
        }));

        console.log(`[WhatsApp Webhook] [${requestId}] Calling WhatsApp API: ${WHATSAPP_API_URL}`);
        const apiStartTime = Date.now();

        // Send request to WhatsApp API
        const response = await fetch(WHATSAPP_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            },
            body: JSON.stringify(whatsappPayload),
        });

        const apiDuration = Date.now() - apiStartTime;
        console.log(`[WhatsApp Webhook] [${requestId}] WhatsApp API responded in ${apiDuration}ms with status: ${response.status}`);

        const responseData = await response.json();
        console.log(`[WhatsApp Webhook] [${requestId}] API response data:`, JSON.stringify(responseData));

        // Handle WhatsApp API response
        if (!response.ok) {
            console.error(`[WhatsApp Webhook] [${requestId}] ERROR: WhatsApp API returned error:`, {
                status: response.status,
                statusText: response.statusText,
                error: responseData.error,
            });
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to send WhatsApp message',
                    error: responseData.error?.message || 'WhatsApp API error',
                    data: responseData,
                },
                { status: response.status },
            );
        }

        console.log(`[WhatsApp Webhook] [${requestId}] SUCCESS: Message sent to ${cleanPhoneNumber}`);
        return NextResponse.json(
            {
                success: true,
                message: 'WhatsApp message sent successfully',
                data: responseData,
            },
            { status: 200 },
        );

    } catch (error) {
        console.error(`[WhatsApp Webhook] [${requestId}] EXCEPTION:`, error);
        console.error(`[WhatsApp Webhook] [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// Handle GET requests for testing
export async function GET(): Promise<NextResponse> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[WhatsApp Webhook] [${requestId}] GET request received - Health check`);

    return NextResponse.json(
        {
            success: true,
            message: 'WhatsApp webhook is running',
            endpoint: '/api/webhook/whatsapp',
            method: 'POST',
            requiredFields: ['phoneNumber'],
        },
        { status: 200 },
    );
}
