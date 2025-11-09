import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';



import PhoneNumber from '@/models/PhoneNumber';
import VoiceAgent, { type IVoiceAgent } from '@/models/VoiceAgent';
import { NextResponse, type NextRequest } from 'next/server';

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
    context: RouteContext,
) {
    const { phoneId } = await context.params;
    console.log('[Exotel Webhook] Incoming call for phone ID:', phoneId);

    try {
        await dbConnect();

        // Parse Exotel webhook data (can be form-urlencoded or JSON)
        const contentType = request.headers.get('content-type');
        let exotelData: Record<string, unknown> = {};

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
            Direction: exotelData.Direction,
            CallType: exotelData.CallType,
        });

        // Extract phone ID from the route parameter
        // Find the phone number configuration
        const phoneNumber = await PhoneNumber.findOne({
            $or: [
                { webhookIdentifier: phoneId },
                { _id: phoneId },
                { webhookUrl: { $regex: phoneId } },
            ],
        });

        if (!phoneNumber) {
            console.error('[Exotel Webhook] Phone number not found for ID:', phoneId);
            // Return XML error response for Exotel
            return new NextResponse(
                generateErrorResponse('Phone number configuration not found'),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/xml' },
                },
            );
        }

        console.log('[Exotel Webhook] Found phone number:', {
            id: phoneNumber._id,
            number: phoneNumber.phoneNumber,
            linkedAgentId: phoneNumber.linkedAgentId,
        });

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
            // Return XML error response for Exotel
            return new NextResponse(
                generateErrorResponse('No agent configured for this number'),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/xml' },
                },
            );
        }

        console.log('[Exotel Webhook] Using agent:', {
            id: agent._id,
            name: agent.name,
            prompt: `${agent.prompt?.substring(0, 50)}...`,
        });

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

        // Generate Exotel Passthru XML response
        const response = generateExotelResponse(agent, sessionId);

        console.log('[Exotel Webhook] Generated XML response (first 300 chars):', response.substring(0, 300));

        return new NextResponse(response, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
            },
        });

    } catch (error) {
        console.error('[Exotel Webhook] Error handling webhook:', error);
        // Return XML error response for Exotel
        return new NextResponse(
            generateErrorResponse('Internal server error occurred'),
            {
                status: 200,
                headers: { 'Content-Type': 'application/xml' },
            },
        );
    }
}

/**
 * Generate error response in Exotel XML format
 */
function generateErrorResponse(message: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>We apologize for the inconvenience. ${message}. Please try again later.</Say>
    <Hangup/>
</Response>`;
}

/**
 * Generate Exotel Passthru XML response
 *
 * Exotel Passthru supports these verbs:
 * - Say: Text-to-speech playback
 * - Play: Play audio file from URL
 * - Dial: Dial another number
 * - Record: Record the call
 * - Gather: Collect DTMF input
 * - Hangup: End the call
 * - Pause: Wait for specified seconds
 * - Redirect: Redirect to another URL
 *
 * Documentation: https://developer.exotel.com/api/#passthru-applet
 */
function generateExotelResponse(agent: IVoiceAgent, sessionId: string): string {
    // Determine language from agent prompt
    const isHindi = agent.prompt?.includes('नमस्ते') || agent.prompt?.includes('हिंदी');

    const greeting = isHindi
        ? 'नमस्ते। मैं आपकी सहायता के लिए यहां हूं।'
        : 'Hello, I am here to assist you today.';

    const waitMessage = isHindi
        ? 'कृपया एक पल प्रतीक्षा करें।'
        : 'Please wait a moment while I connect you.';

    // Simple response that plays greeting and hangs up
    // In production, you would:
    // 1. Use <Gather> to collect user input
    // 2. Use <Redirect> to send to another endpoint for processing
    // 3. Use <Dial> to connect to another number
    // 4. Use <Record> to record the conversation
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>${greeting}</Say>
    <Pause length="1"/>
    <Say>${waitMessage}</Say>
    <Pause length="2"/>
    <Say>This is a test response. Your call has been successfully connected. Session ID: ${sessionId.substring(0, 20)}</Say>
    <Hangup/>
</Response>`;
}

// Handle GET requests for webhook verification
export async function GET(
    request: NextRequest,
    context: RouteContext,
) {
    const { phoneId } = await context.params;
    return NextResponse.json({
        status: 'active',
        phoneId,
        message: 'Exotel webhook endpoint is active',
    });
}
