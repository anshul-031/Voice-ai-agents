import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import PhoneNumber from '@/models/PhoneNumber';
import VoiceAgent from '@/models/VoiceAgent';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Exotel Webhook Handler
 * 
 * This endpoint receives incoming call webhooks from Exotel.
 * It identifies the phone number, finds the linked agent, and handles the call flow.
 * 
 * Exotel sends call events to this webhook with parameters like:
 * - CallSid: Unique identifier for the call
 * - From: Caller's phone number
 * - To: Your Exotel number
 * - Status: Call status (ringing, in-progress, completed, etc.)
 * - RecordingUrl: URL of the call recording (if enabled)
 */

interface RouteContext {
    params: Promise<{
        phoneId: string;
    }>;
}

export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    const { phoneId } = await context.params;
    console.log('[Exotel Webhook] Incoming call for phone ID:', phoneId);

    try {
        await dbConnect();

        // Parse Exotel webhook data (can be form-urlencoded or JSON)
        const contentType = request.headers.get('content-type');
        let exotelData: any = {};

        if (contentType?.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            exotelData = Object.fromEntries(formData.entries());
        } else {
            exotelData = await request.json();
        }

        console.log('[Exotel Webhook] Received data:', {
            CallSid: exotelData.CallSid,
            From: exotelData.From,
            To: exotelData.To,
            Status: exotelData.Status,
        });

        // Extract phone ID from the route parameter
        // Find the phone number configuration
        const phoneNumber = await PhoneNumber.findOne({
            $or: [
                { _id: phoneId },
                { webhookUrl: { $regex: phoneId } }
            ]
        });

        if (!phoneNumber) {
            console.error('[Exotel Webhook] Phone number not found for ID:', phoneId);
            return NextResponse.json(
                { error: 'Phone number not found' },
                { status: 404 }
            );
        }

        // Update last used timestamp
        phoneNumber.lastUsed = new Date();
        await phoneNumber.save();

        // Find linked agent
        let agent = null;
        if (phoneNumber.linkedAgentId) {
            agent = await VoiceAgent.findById(phoneNumber.linkedAgentId);
        }

        if (!agent) {
            // If no agent linked, use a default agent or return error
            console.warn('[Exotel Webhook] No agent linked to phone number');
            agent = await VoiceAgent.findOne({ userId: phoneNumber.userId }).sort({ createdAt: -1 });
        }

        if (!agent) {
            console.error('[Exotel Webhook] No agent available');
            return NextResponse.json(
                { error: 'No agent configured' },
                { status: 500 }
            );
        }

        // Generate a unique session ID for this call
        const sessionId = `exotel_${exotelData.CallSid || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Log the call in chat history
        await Chat.create({
            userId: phoneNumber.userId,
            sessionId,
            role: 'system',
            content: `Call initiated from ${exotelData.From} to ${exotelData.To}`,
            systemPrompt: agent.prompt,
            timestamp: new Date(),
        });

        // Generate TwiML/Exotel response
        // This tells Exotel what to do with the call
        const response = generateExotelResponse(agent, sessionId, phoneNumber.websocketUrl);

        return new NextResponse(response, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
            },
        });

    } catch (error) {
        console.error('[Exotel Webhook] Error handling webhook:', error);
        return NextResponse.json(
            {
                error: 'Failed to process webhook',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Generate Exotel XML response
 * This response tells Exotel how to handle the call
 */
function generateExotelResponse(agent: any, sessionId: string, websocketUrl?: string): string {
    // Exotel uses similar TwiML-like XML format
    // This is a basic example - you'll need to customize based on your Exotel setup
    
    const greeting = agent.prompt.includes('नमस्ते') 
        ? 'नमस्ते। कृपया प्रतीक्षा करें।'
        : 'Hello, please wait while we connect you.';

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman" language="hi-IN">${greeting}</Say>
    ${websocketUrl ? `
    <Connect>
        <Stream url="${websocketUrl}">
            <Parameter name="sessionId" value="${sessionId}" />
            <Parameter name="agentId" value="${agent._id}" />
        </Stream>
    </Connect>
    ` : `
    <Say voice="woman" language="hi-IN">We are experiencing technical difficulties. Please try again later.</Say>
    <Hangup/>
    `}
</Response>`;
}

// Handle GET requests for webhook verification
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    const { phoneId } = await context.params;
    return NextResponse.json({
        status: 'active',
        phoneId,
        message: 'Exotel webhook endpoint is active',
    });
}
