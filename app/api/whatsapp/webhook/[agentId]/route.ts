import dbConnect from '@/lib/dbConnect';
import Chat from '@/models/Chat';
import VoiceAgent from '@/models/VoiceAgent';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/whatsapp/webhook/[agentId]
 * Webhook verification for WhatsApp
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    const { agentId } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[WhatsApp Webhook] Verification request:', { mode, token, agentId });

    // Verify token (you can make this configurable per agent if needed)
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'pelocal_verify_token_2025';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[WhatsApp Webhook] Verification successful');
        return new NextResponse(challenge, { status: 200 });
    }

    console.log('[WhatsApp Webhook] Verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook/[agentId]
 * Receive incoming WhatsApp messages
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const body = await request.json();
        console.log('[WhatsApp Webhook] Incoming message:', JSON.stringify(body, null, 2));

        // WhatsApp sends updates in this format
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) {
            // Not a message event (could be status update, etc.)
            return NextResponse.json({ success: true, message: 'No messages to process' });
        }

        // Connect to database
        await dbConnect();

        // Get agent configuration
        const agent = await VoiceAgent.findById(agentId);
        if (!agent) {
            console.error('[WhatsApp Webhook] Agent not found:', agentId);
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        if (!agent.whatsappConfig?.enabled) {
            console.error('[WhatsApp Webhook] WhatsApp not enabled for agent:', agentId);
            return NextResponse.json({ error: 'WhatsApp not enabled' }, { status: 400 });
        }

        // Process each message
        for (const message of messages) {
            const from = message.from; // User's phone number
            const messageId = message.id;
            const timestamp = message.timestamp;

            // Handle different message types
            let userText = '';
            if (message.type === 'text') {
                userText = message.text.body;
            } else if (message.type === 'button') {
                userText = message.button.text;
            } else if (message.type === 'interactive') {
                userText = message.interactive.button_reply?.title || message.interactive.list_reply?.title || '';
            } else {
                console.log('[WhatsApp Webhook] Unsupported message type:', message.type);
                continue;
            }

            console.log('[WhatsApp Webhook] Processing message from', from, ':', userText);

            // Create session ID for this conversation
            const sessionId = `whatsapp_${from}_${agentId}`;

            // Get conversation history from database
            const conversationHistory = await Chat.find({ sessionId })
                .sort({ timestamp: 1 })
                .limit(20)
                .select('text source')
                .lean();

            // Process with LLM
            const llmResponse = await fetch(`${request.nextUrl.origin}/api/llm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: agent.prompt,
                    userText,
                    conversationHistory: conversationHistory.map(msg => ({
                        text: msg.text,
                        source: msg.source
                    })),
                    sessionId,
                    agentId,
                }),
            });

            if (!llmResponse.ok) {
                console.error('[WhatsApp Webhook] LLM processing failed');
                continue;
            }

            const llmData = await llmResponse.json();
            const responseText = llmData.llmText;

            // Send response back to WhatsApp
            await sendWhatsAppMessage(
                from,
                responseText,
                agent.whatsappConfig.accessToken!,
                agent.whatsappConfig.phoneNumber!
            );

            console.log('[WhatsApp Webhook] Response sent to', from);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[WhatsApp Webhook] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * Send a message via WhatsApp Business API
 */
async function sendWhatsAppMessage(
    to: string,
    message: string,
    accessToken: string,
    fromPhoneNumberId: string
): Promise<void> {
    const url = `https://graph.facebook.com/v18.0/${fromPhoneNumberId}/messages`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: message,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('[WhatsApp] Send message failed:', error);
        throw new Error(`Failed to send WhatsApp message: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('[WhatsApp] Message sent successfully:', data);
}
