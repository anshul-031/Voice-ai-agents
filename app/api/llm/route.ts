import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';

// TODO: Add content filtering/safety checks
// TODO: Consider adding streaming responses for better UX

export async function POST(request: NextRequest) {
    console.log('[LLM] POST request received');

    try {
        console.log('[LLM] Parsing request body...');
        const { prompt, userText, sessionId } = await request.json();
        console.log('[LLM] Request data:', {
            hasPrompt: !!prompt,
            promptLength: prompt?.length,
            userText: userText?.substring(0, 100),
            sessionId
        });

        if (!userText?.trim()) {
            console.error('[LLM] No user text provided');
            return NextResponse.json({ error: 'No user text provided' }, { status: 400 });
        }

        // Connect to MongoDB for saving chat history
        await dbConnect();
        console.log('[LLM] Connected to MongoDB');

        // Generate a session ID if not provided
        const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Save user message to database
        try {
            await Chat.create({
                userId: 'mukul', // Hardcoded user for now
                sessionId: chatSessionId,
                role: 'user',
                content: userText.trim(),
                systemPrompt: prompt?.trim(),
                timestamp: new Date(),
            });
            console.log('[LLM] User message saved to database');
        } catch (dbError) {
            console.error('[LLM] Failed to save user message:', dbError);
            // Continue with LLM request even if DB save fails
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.error('[LLM] Gemini API key not configured');
            return NextResponse.json({ error: 'LLM service not configured' }, { status: 500 });
        }

        console.log('[LLM] Gemini API Key present:', !!geminiApiKey);
        console.log('[LLM] User text:', userText.trim());

        // Initialize Gemini AI (explicitly use gemini-2.0-flash as requested)
        console.log('[LLM] Initializing GoogleGenerativeAI...');
        const genAI = new GoogleGenerativeAI(geminiApiKey);

        // Prefer the exact model the user indicated. Provide a clear fallback.
        let model;
        try {
            console.log('[LLM] Attempting to load gemini-2.0-flash model...');
            model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            console.log('[LLM] Using model: gemini-2.0-flash');
        } catch (errInit) {
            console.warn('[LLM] Could not initialize gemini-2.0-flash, attempting fallback model (gemini-pro).', (errInit as any)?.message ?? errInit);
            try {
                model = genAI.getGenerativeModel({ model: 'gemini-pro' });
                console.log('[LLM] Using fallback model: gemini-pro');
            } catch (errFallback) {
                console.error('[LLM] Failed to initialize any supported model:', errFallback);
                return NextResponse.json({ error: 'Failed to initialize AI model' }, { status: 500 });
            }
        }

        // Combine system prompt with user input
        const fullPrompt = prompt?.trim()
            ? `${prompt.trim()}\n\nUser: ${userText.trim()}`
            : `User: ${userText.trim()}`;

        console.log('[LLM] Full prompt length:', fullPrompt.length);
        console.log('[LLM] Sending prompt to Gemini (trimmed preview):', fullPrompt.substring(0, 200));

        // Helper to extract text from various possible SDK return shapes
        const extractText = async (raw: any) => {
            try {
                if (!raw) return null;

                // Case: result has .response which has .text() (older SDK pattern)
                if (raw.response && typeof raw.response.text === 'function') {
                    return await raw.response.text();
                }

                // Case: raw itself has .text()
                if (typeof raw.text === 'function') {
                    return await raw.text();
                }

                // Case: raw has output/outputs/candidates fields
                if (raw.output && Array.isArray(raw.output) && raw.output[0]) {
                    const o = raw.output[0];
                    if (typeof o.content === 'string') return o.content;
                    if (Array.isArray(o.content) && o.content[0] && typeof o.content[0].text === 'string') return o.content[0].text;
                }

                if (raw.candidates && Array.isArray(raw.candidates) && raw.candidates[0]) {
                    if (typeof raw.candidates[0].output === 'string') return raw.candidates[0].output;
                    if (raw.candidates[0].content && typeof raw.candidates[0].content === 'string') return raw.candidates[0].content;
                }

                // If plain string
                if (typeof raw === 'string') return raw;

                // If an object with a top-level `text` field
                if (typeof raw.text === 'string') return raw.text;

                // Last-resort: try JSON stringify as fallback
                return JSON.stringify(raw);
            } catch (e) {
                console.warn('Failed to extract text from LLM raw result', e);
                return null;
            }
        };

        try {
            console.log('[LLM] Calling model.generateContent...');
            let result: any;

            // Some SDKs expose generateContent, others expose generate — support both
            if (typeof (model as any).generateContent === 'function') {
                console.log('[LLM] Using generateContent method');
                result = await (model as any).generateContent(fullPrompt);
            } else if (typeof (model as any).generate === 'function') {
                console.log('[LLM] Using generate method');
                // try a few common call shapes
                try {
                    result = await (model as any).generate({ prompt: fullPrompt });
                } catch (eGen) {
                    console.log('[LLM] Retrying generate with direct string parameter');
                    // older SDKs might accept a single string
                    result = await (model as any).generate(fullPrompt);
                }
            } else {
                console.error('[LLM] Model does not expose generateContent or generate methods');
                throw new Error('Model does not expose generateContent or generate methods');
            }

            console.log('[LLM] Model generation completed');
            const llmText = await extractText(result);

            console.log('[LLM] Gemini raw result sample:', typeof result === 'object' ? JSON.stringify(Object.keys(result).slice(0, 10)) : String(result).substring(0, 200));
            console.log('[LLM] Extracted LLM text preview:', llmText?.substring(0, 200));

            if (!llmText) {
                console.error('[LLM] Received empty response from LLM');
                return NextResponse.json({ error: 'Received empty response from LLM', details: typeof result === 'object' ? result : String(result) }, { status: 500 });
            }

            console.log('[LLM] Successfully generated response, length:', llmText.length);

            // Save assistant response to database
            try {
                await Chat.create({
                    userId: 'mukul', // Hardcoded user for now
                    sessionId: chatSessionId,
                    role: 'assistant',
                    content: llmText.trim(),
                    timestamp: new Date(),
                });
                console.log('[LLM] Assistant response saved to database');
            } catch (dbError) {
                console.error('[LLM] Failed to save assistant response:', dbError);
                // Continue even if DB save fails
            }

            return NextResponse.json({
                llmText: llmText.trim(),
                sessionId: chatSessionId
            });

        } catch (errGenerate: any) {
            console.error('[LLM] Error while calling model.generate/generateContent:', errGenerate);

            // If the underlying library attached an HTTP response, surface status and body
            const status = errGenerate?.status || errGenerate?.response?.status || null;
            const body = errGenerate?.response?.data || errGenerate?.response?.body || errGenerate?.message || null;

            console.log('[LLM] Error status:', status, 'body:', body);

            if (status) {
                console.error('[LLM] LLM HTTP status:', status, 'body:', body);
                // Map 404 to 404 (model not found) to give clearer instruction
                if (status === 404) {
                    console.error('[LLM] Model or endpoint not found (404)');
                    return NextResponse.json({ error: 'LLM model or endpoint not found (404)', details: body }, { status: 404 });
                }
                if (status === 401 || status === 403) {
                    console.error('[LLM] Authentication error:', status);
                    return NextResponse.json({ error: 'Authentication error calling Gemini/LLM', details: body }, { status });
                }
                if (status === 429) {
                    console.error('[LLM] Rate limit / quota exceeded');
                    return NextResponse.json({ error: 'Rate limit / quota exceeded for Gemini', details: body }, { status: 429 });
                }
            }

            console.error('[LLM] Returning generic generate error');
            return NextResponse.json({ error: 'LLM generate error', details: errGenerate?.message ?? String(errGenerate) }, { status: 500 });
        }

    } catch (error) {
        console.error('[LLM] LLM API error:', error);

        // Log full error details for debugging
        if (error && typeof error === 'object') {
            console.error('[LLM] Error details:', JSON.stringify(error, null, 2));
        }

        // Handle specific Gemini API errors
        if (error instanceof Error) {
            console.error('[LLM] Error type: Error');
            console.error('[LLM] Error message:', error.message);
            console.error('[LLM] Error stack:', error.stack);

            if (error.message.includes('API_KEY') || error.message.includes('API key')) {
                console.error('[LLM] Invalid or missing API key detected');
                return NextResponse.json({ error: 'Invalid or missing Gemini API key' }, { status: 401 });
            }
            if (error.message.includes('SAFETY')) {
                console.error('[LLM] Content filtered by safety policies');
                return NextResponse.json({ error: 'Content filtered by safety policies' }, { status: 400 });
            }
            if (error.message.includes('QUOTA') || error.message.includes('quota')) {
                console.error('[LLM] API quota exceeded');
                return NextResponse.json({ error: 'API quota exceeded' }, { status: 429 });
            }
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                console.error('[LLM] Model not found or invalid API key');
                return NextResponse.json({ error: 'Invalid API key or model not available. Please check your Gemini API key.' }, { status: 401 });
            }
        }

        console.error('[LLM] Returning generic service error');
        return NextResponse.json({
            error: 'LLM service error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}