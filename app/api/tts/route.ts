import { NextRequest, NextResponse } from 'next/server';

// TODO: Add voice selection options (male/female, different accents)
// TODO: Add SSML support for better speech control
// TODO: Consider caching for repeated text requests

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        if (!text?.trim()) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        if (!deepgramApiKey) {
            console.error('Deepgram API key not configured');
            return NextResponse.json({ error: 'TTS service not configured' }, { status: 500 });
        }

        // Call Deepgram TTS API
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

        if (!deepgramResponse.ok) {
            const errorText = await deepgramResponse.text();
            console.error('Deepgram TTS failed:', errorText);
            return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
        }

        // Get audio data as buffer
        const audioBuffer = await deepgramResponse.arrayBuffer();

        // Convert to base64 for JSON response
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        return NextResponse.json({
            audioData: base64Audio,
            mimeType: 'audio/wav', // TODO: Verify actual format returned by Deepgram
        });

    } catch (error) {
        console.error('TTS API error:', error);

        // Handle specific Deepgram API errors
        if (error instanceof Error) {
            if (error.message.includes('401') || error.message.includes('API_KEY')) {
                return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
            }
            if (error.message.includes('402') || error.message.includes('credits')) {
                return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
            }
            if (error.message.includes('429')) {
                return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
            }
        }

        return NextResponse.json({ error: 'TTS service error' }, { status: 500 });
    }
}