import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

// Sarvam TTS API implementation with Manisha voice
// Sarvam AI provides high-quality Indian language TTS
// Voice: Manisha - Natural sounding female voice for Hindi/Hinglish

const MAX_CHARS_PER_REQUEST = 450;

function sanitizeTextForTTS(raw: string): string {
    let text = raw
        .replace(/[`*_~]/g, '') // remove markdown emphasis
        .replace(/#{1,6}\s*/g, '') // remove heading markers
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // unwrap markdown links
        .replace(/>{1,}\s*/g, '') // remove blockquote markers
        .replace(/[•·▪►]/g, '') // remove bullet glyphs
        .replace(/\b(\d+)\.\s+/g, 'Option $1: '); // make ordered lists more conversational

    // Remove emoji/extended pictographic characters which Sarvam spells out awkwardly
    text = text.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji}\p{Emoji_Component}]/gu, '');

    text = text
        .replace(/\s{2,}/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .trim();

    return text;
}

function chunkTextForTTS(text: string, maxLen: number = MAX_CHARS_PER_REQUEST): string[] {
    const chunks: string[] = [];
    const sentences = text
        .split(/(?<=[.!?])\s+|\n+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);

    let current = '';

    const flushCurrent = () => {
        if (current.trim()) {
            chunks.push(current.trim());
            current = '';
        }
    };

    for (const sentence of sentences) {
        if (!sentence) continue;

        if ((current + ' ' + sentence).trim().length <= maxLen) {
            current = current ? `${current} ${sentence}` : sentence;
            continue;
        }

        flushCurrent();

        if (sentence.length <= maxLen) {
            current = sentence;
            continue;
        }

        // Hard split long sentence without natural break points
        let remaining = sentence;
        while (remaining.length > maxLen) {
            const splitIndex = remaining.lastIndexOf(' ', maxLen);
            const cutoff = splitIndex > maxLen / 2 ? splitIndex : maxLen;
            chunks.push(remaining.slice(0, cutoff).trim());
            remaining = remaining.slice(cutoff).trim();
        }
        if (remaining) {
            current = remaining;
        }
    }

    flushCurrent();

    if (!chunks.length && text) {
        chunks.push(text.slice(0, maxLen));
    }

    return chunks;
}

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
        const sanitized = sanitizeTextForTTS(text);
        if (!sanitized) {
            console.error('[TTS] Sanitized text is empty');
            return NextResponse.json({ error: 'Nothing to synthesize after cleaning text' }, { status: 400 });
        }

        console.log('[TTS] Sanitized length:', sanitized.length, 'characters');
        const chunks = chunkTextForTTS(sanitized);
        console.log('[TTS] Chunk count:', chunks.length);

        const audioBuffers: Buffer[] = [];

        for (const [index, chunk] of chunks.entries()) {
            console.log(`[TTS] Synthesizing chunk ${index + 1}/${chunks.length}, length ${chunk.length}`);

            const sarvamResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
                method: 'POST',
                headers: {
                    'api-subscription-key': sarvamApiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: [chunk],
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

            if (!sarvamResponse.ok) {
                const errorText = await sarvamResponse.text();
                console.error('[TTS] Sarvam TTS failed (chunk):', errorText);
                return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
            }

            const sarvamData = await sarvamResponse.json();
            if (!sarvamData.audios || !sarvamData.audios[0]) {
                console.error('[TTS] No audio data in Sarvam response for chunk');
                return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
            }

            const base64Audio = sarvamData.audios[0];
            audioBuffers.push(Buffer.from(base64Audio, 'base64'));
        }

        const combinedAudio = Buffer.concat(audioBuffers);
        console.log('[TTS] Combined audio buffer length:', combinedAudio.length);

        return NextResponse.json({
            audioData: combinedAudio.toString('base64'),
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
