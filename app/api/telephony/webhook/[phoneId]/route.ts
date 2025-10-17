import dbConnect from '@/lib/mongodb';

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


        const contentType = request.headers.get('content-type');
        let exotelData: any = {};

        if (contentType?.includes('application/x-www-form-urlencoded')) {
            // Parse URL-encoded form data
            const text = await request.text();
            const params = new URLSearchParams(text);
            exotelData = Object.fromEntries(params.entries());
        } else if (contentType?.includes('application/json')) {
            exotelData = await request.json();
        } else {
            // If no body, check query params
            const url = new URL(request.url);
            exotelData = Object.fromEntries(url.searchParams.entries());
          
        }

        console.log('[Exotel Webhook] Received data:', {
            CallSid: exotelData.CallSid,
            From: exotelData.From,
            To: exotelData.To,
            CallStatus: exotelData.CallStatus,
            RecordingUrl: exotelData.RecordingUrl,
            Digits: exotelData.Digits,
            SpeechResult: exotelData.SpeechResult,
        });

        // Find phone number configuration
        const phoneNumber = await PhoneNumber.findById(phoneId);

        if (!phoneNumber) {
            console.error('[Exotel Webhook] Phone number not found for ID:', phoneId);
            return new NextResponse(
                generateErrorResponse('Phone number not configured'),
                {
                    status: 200, // Return 200 with error message to avoid Exotel retries
                    headers: { 'Content-Type': 'application/xml' },
                }
            );
        }

        // Update last used timestamp
        phoneNumber.lastUsed = new Date();
        await phoneNumber.save();

        // Find linked agent
        const agent = await VoiceAgent.findById(phoneNumber.linkedAgentId);

        if (!agent) {
            console.error('[Exotel Webhook] No agent linked to phone number');
            return new NextResponse(
                generateErrorResponse('No agent configured for this number'),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/xml' },
                }
            );
        }

        // Generate session ID if new call
        const sessionId = exotelData.CallSid 
            ? `exotel_${exotelData.CallSid}` 
            : `exotel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('[Exotel Webhook] Session ID:', sessionId);

        // Check if this is a callback with user input
        const userInput = exotelData.SpeechResult || exotelData.RecordingUrl || exotelData.Digits;

        if (userInput) {
            // User has provided input - process with LLM
            console.log('[Exotel Webhook] Processing user input:', userInput);
            
            const response = await processUserInput(
                userInput,
                agent,
                sessionId,
                phoneId,
                exotelData.RecordingUrl ? 'audio' : 'text'
            );

            return new NextResponse(response, {
                status: 200,
                headers: { 'Content-Type': 'application/xml' },
            });
        } else {
            // Initial call - play greeting and wait for input
            console.log('[Exotel Webhook] Initial call - sending greeting');
            
            const response = generateInitialResponse(agent, phoneId);
            
            return new NextResponse(response, {
                status: 200,
                headers: { 'Content-Type': 'application/xml' },
            });
        }

    } catch (error) {
        console.error('[Exotel Webhook] Error handling webhook:', error);
        return new NextResponse(
            generateErrorResponse('Internal server error'),
            {
                status: 200,
                headers: { 'Content-Type': 'application/xml' },
            }
        );
    }
}

/**
 * Process user input with LLM and generate response
 */
async function processUserInput(
    input: string,
    agent: any,
    sessionId: string,
    phoneId: string,
    inputType: 'text' | 'audio'
): Promise<string> {
    try {
        let userText = input;

        // If input is audio URL, transcribe it with STT service
        if (inputType === 'audio') {
            console.log('[Exotel Webhook] Transcribing audio from URL:', input);
            
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const sttResponse = await fetch(`${baseUrl}/api/telephony/stt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recordingUrl: input,
                    language: 'hi', // Hindi
                }),
            });

            if (!sttResponse.ok) {
                throw new Error('STT service failed');
            }

            const sttData = await sttResponse.json();
            userText = sttData.text;
            console.log('[Exotel Webhook] Transcribed text:', userText);
        }

        // Call LLM API to process the input
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const llmResponse = await fetch(`${baseUrl}/api/llm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: agent.prompt,
                userText,
                sessionId,
                conversationHistory: [], // TODO: Fetch from database for context
            }),
        });

        if (!llmResponse.ok) {
            throw new Error('LLM API failed');
        }

        const llmData = await llmResponse.json();
        const assistantText = llmData.llmText;

        console.log('[Exotel Webhook] LLM response:', assistantText);

        // Generate XML response with assistant's message and gather next input
        return generateContinueResponse(assistantText, phoneId);

    } catch (error) {
        console.error('[Exotel Webhook] Error processing input:', error);
        return generateErrorResponse('क्षमा करें, मैं आपके अनुरोध को संसाधित नहीं कर सका');
    }
}

/**
 * Generate initial greeting response
 */
function generateInitialResponse(agent: any, phoneId: string): string {
    const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telephony/webhook/${phoneId}`;
    
    // Extract greeting from agent prompt (first sentence or first 100 chars)
    const greeting = extractGreeting(agent.prompt);
    
    // Use Exotel's Passthru XML format
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman" language="hi-IN">${escapeXml(greeting)}</Say>
    <Record maxLength="30" timeout="5" action="${actionUrl}" method="POST" playBeep="false"/>
    <Say voice="woman" language="hi-IN">मुझे आपकी प्रतिक्रिया नहीं सुनाई दी। कृपया दोबारा कोशिश करें।</Say>
    <Redirect>${actionUrl}</Redirect>
</Response>`;
}

/**
 * Generate continue conversation response
 */
function generateContinueResponse(message: string, phoneId: string): string {
    const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telephony/webhook/${phoneId}`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman" language="hi-IN">${escapeXml(message)}</Say>
    <Record maxLength="30" timeout="5" action="${actionUrl}" method="POST" playBeep="false"/>
    <Say voice="woman" language="hi-IN">क्या आपको कुछ और चाहिए?</Say>
    <Redirect>${actionUrl}</Redirect>
</Response>`;
}

/**
 * Generate error response
 */
function generateErrorResponse(errorMessage: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman" language="hi-IN">${escapeXml(errorMessage)}</Say>
    <Hangup/>
</Response>`;
}

/**
 * Extract greeting from agent prompt
 */
function extractGreeting(prompt: string): string {
    // Try to find first sentence or first 150 characters
    const firstSentence = prompt.split(/[.!?।]/)[0];
    if (firstSentence.length > 0 && firstSentence.length < 200) {
        return firstSentence.trim();
    }
    return prompt.substring(0, 150).trim() + '...';
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}


// Handle GET requests for webhook verification
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    const { phoneId } = await context.params;
    console.log('[Exotel Webhook] GET - Verification request for phone ID:', phoneId);
    
    return NextResponse.json({
        status: 'active',
        phoneId,
        message: 'Exotel webhook endpoint is active',
        instructions: 'Configure this URL in your Exotel Passthru App settings',
    });
}
