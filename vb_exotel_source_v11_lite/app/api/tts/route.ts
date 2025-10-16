import { NextRequest, NextResponse } from 'next/server';

// TODO: Add voice selection options (male/female, different accents)
// TODO: Add SSML support for better speech control
// TODO: Consider caching for repeated text requests

export async function POST(request: NextRequest) {
    console.log('[TTS] POST request received');

    try {
        console.log('[TTS] Parsing request body...');
        const { text } = await request.json();
        console.log('[TTS] Text to convert:', text?.substring(0, 100));

        if (!text?.trim()) {
            console.error('[TTS] No text provided');
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        if (!deepgramApiKey) {
            console.error('[TTS] Deepgram API key not configured');
            return NextResponse.json({ error: 'TTS service not configured' }, { status: 500 });
        }

        console.log('[TTS] Deepgram API key present:', !!deepgramApiKey);
        console.log('[TTS] Text length:', text.trim().length, 'characters');

        // Call Deepgram TTS API
        console.log('[TTS] Calling Deepgram TTS API...');
        const deepgramResponse = await fetch('https://api.deepgram.com/v1/speak?model=aura-luna-en', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${deepgramApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text.trim(),
            }),
        });

        console.log('[TTS] Deepgram response status:', deepgramResponse.status);
        console.log('[TTS] Deepgram response headers:', Object.fromEntries(deepgramResponse.headers.entries()));

        if (!deepgramResponse.ok) {
            const errorText = await deepgramResponse.text();
            console.error('[TTS] Deepgram TTS failed:', errorText);
            return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
        }

        // Get audio data as buffer
        console.log('[TTS] Reading audio buffer...');
        const audioBuffer = await deepgramResponse.arrayBuffer();
        console.log('[TTS] Audio buffer size:', audioBuffer.byteLength, 'bytes');

        // Convert to base64 for JSON response
        console.log('[TTS] Converting to base64...');
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        console.log('[TTS] Base64 audio length:', base64Audio.length, 'characters');

        console.log('[TTS] Returning audio data');
        return NextResponse.json({
            audioData: base64Audio,
            mimeType: 'audio/wav', // TODO: Verify actual format returned by Deepgram
        });

    } catch (error) {
        console.error('[TTS] TTS API error:', error);

        // Log full error details for debugging
        if (error && typeof error === 'object') {
            console.error('[TTS] Error details:', JSON.stringify(error, null, 2));
        }

        // Handle specific Deepgram API errors
        if (error instanceof Error) {
            console.error('[TTS] Error type: Error');
            console.error('[TTS] Error message:', error.message);
            console.error('[TTS] Error stack:', error.stack);

            if (error.message.includes('401') || error.message.includes('API_KEY')) {
                console.error('[TTS] Invalid API key detected');
                return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
            }
            if (error.message.includes('402') || error.message.includes('credits')) {
                console.error('[TTS] Insufficient credits');
                return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
            }
            if (error.message.includes('429')) {
                console.error('[TTS] Rate limit exceeded');
                return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
            }
        }

        console.error('[TTS] Returning generic service error');
        return NextResponse.json({ error: 'TTS service error' }, { status: 500 });
    }
}