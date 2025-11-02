import { NextResponse, type NextRequest } from 'next/server';

import { processWhatsAppCallback } from '@/lib/whatsAppService';

export async function POST(req: NextRequest) {
    try {
        console.log('[WhatsApp Webhook] POST request received at:', new Date().toISOString());
        const callbackResponse = await req.text(); // Get raw body as string
        console.log('[WhatsApp Webhook] Raw callback:', callbackResponse);
        const parsedResponse = JSON.parse(callbackResponse); // Parse body as JSON
        console.log('[WhatsApp Webhook] Parsed callback:', JSON.stringify(parsedResponse, null, 2));
        await processWhatsAppCallback(parsedResponse);

        console.log('[WhatsApp Webhook] Processing completed successfully');
        return NextResponse.json({ message: 'SUCCESS' }, { status: 200 });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error('[WhatsApp Webhook] Exception:', errorMessage);
        console.error('[WhatsApp Webhook] Full error:', e);
        return NextResponse.json({ message: 'ERROR', error: errorMessage }, { status: 500 });
    }
}


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[WhatsApp Webhook] GET request - mode:', mode, 'token:', token ? 'present' : 'missing');

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
            console.log('[WhatsApp Webhook] WEBHOOK VERIFIED ✓');
            return new NextResponse(challenge, { status: 200 });
        }
        console.log('[WhatsApp Webhook] VERIFICATION FAILED - token mismatch');
        return new NextResponse('VERIFICATION_FAILED', { status: 403 });
    }
    console.log('[WhatsApp Webhook] MISSING PARAMETERS');
    return new NextResponse('MISSING_PARAMETERS', { status: 400 });
}
