import { NextResponse, type NextRequest } from 'next/server';

// Sarvam TTS API implementation with Manisha voice
// Sarvam AI provides high-quality Indian language TTS
// Voice: Manisha - Natural sounding female voice for Hindi/Hinglish

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

        const sarvamApiKey = process.env.SARVAM_API_KEY;
        if (!sarvamApiKey) {
            console.error('[TTS] Sarvam API key not configured');
            return NextResponse.json({ error: 'TTS service not configured' }, { status: 500 });
        }

        console.log('[TTS] Sarvam API key present:', !!sarvamApiKey);
        console.log('[TTS] Text length:', text.trim().length, 'characters');

        // Call Sarvam TTS API with Manisha voice
        console.log('[TTS] Calling Sarvam TTS API with Manisha voice...');
        const sarvamResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'api-subscription-key': sarvamApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: [text.trim()],
                target_language_code: 'hi-IN',
                speaker: 'manisha',
                pitch: 0,
                pace: 1.0,
                loudness: 1.5,
                speech_sample_rate: 8000,
                enable_preprocessing: true,
                model: 'bulbul:v2',
            }),
        });

        console.log('[TTS] Sarvam response status:', sarvamResponse.status);
        console.log('[TTS] Sarvam response headers:', Object.fromEntries(sarvamResponse.headers.entries()));

        if (!sarvamResponse.ok) {
            const errorText = await sarvamResponse.text();
            console.error('[TTS] Sarvam TTS failed:', errorText);
            return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
        }

        // Parse Sarvam response
        console.log('[TTS] Parsing Sarvam response...');
        const sarvamData = await sarvamResponse.json();
        console.log('[TTS] Sarvam response structure:', Object.keys(sarvamData));

        // Sarvam returns base64 audio in the 'audios' array
        if (!sarvamData.audios || !sarvamData.audios[0]) {
            console.error('[TTS] No audio data in Sarvam response');
            return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
        }

        const base64Audio = sarvamData.audios[0];
        console.log('[TTS] Base64 audio length:', base64Audio.length, 'characters');

        console.log('[TTS] Returning audio data');
        return NextResponse.json({
            audioData: base64Audio,
            mimeType: 'audio/wav',
        });

    } catch (error) {
        console.error('[TTS] TTS API error:', error);

        // Log full error details for debugging
        if (error && typeof error === 'object') {
            console.error('[TTS] Error details:', JSON.stringify(error, null, 2));
        }

        // Handle specific Sarvam API errors
        if (error instanceof Error) {
            console.error('[TTS] Error type: Error');
            console.error('[TTS] Error message:', error.message);
            console.error('[TTS] Error stack:', error.stack);

            if (error.message.includes('401') || error.message.includes('API_KEY') || error.message.includes('Unauthorized')) {
                console.error('[TTS] Invalid API key detected');
                return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
            }
            if (error.message.includes('402') || error.message.includes('credits') || error.message.includes('quota')) {
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
