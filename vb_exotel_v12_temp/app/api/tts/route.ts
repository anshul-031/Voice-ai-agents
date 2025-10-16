/* eslint-disable no-console */
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

        // Prefer 8kHz µ-law output for telephony
        const desiredSampleRate = 8000;
        const desiredEncoding = 'mulaw';

        // Call Deepgram TTS API (ask for mulaw 8k if supported)
        console.log('[TTS] Calling Deepgram TTS API...');
        const deepgramUrl = `https://api.deepgram.com/v1/speak?model=aura-luna-en&sample_rate=${desiredSampleRate}&encoding=${desiredEncoding}`;
        const deepgramResponse = await fetch(deepgramUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${deepgramApiKey}`,
                'Content-Type': 'application/json',
                // Let Deepgram return raw audio; do not force a specific mime
                'Accept': 'application/octet-stream',
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
        const audioArrayBuf = await deepgramResponse.arrayBuffer();
        const audioBuf = Buffer.from(audioArrayBuf);
        console.log('[TTS] Audio buffer size:', audioBuf.byteLength, 'bytes');

        // Helper: mu-law encoding table
        const MULAW_MAX = 0x1FFF;
        function linear16ToMuLaw(sample: number): number {
            const BIAS = 0x84; // 132
            let sign = (sample >> 8) & 0x80;
            if (sign !== 0) sample = -sample;
            if (sample > MULAW_MAX) sample = MULAW_MAX;
            sample = sample + BIAS;
            let exponent = 7;
            for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1) { /* loop */ }
            const mantissa = (sample >> ((exponent === 0) ? 4 : (exponent + 3))) & 0x0F;
            const muLawByte = ~(sign | (exponent << 4) | mantissa) & 0xFF;
            return muLawByte;
        }

        // Try to detect if Deepgram already returned mulaw by checking header or parsing WAV
        const contentType = deepgramResponse.headers.get('content-type') || '';
        let mulawBuffer: Buffer | null = null;

        if (contentType.includes('mulaw') || contentType.includes('basic')) {
            console.log('[TTS] Deepgram returned mulaw payload');
            mulawBuffer = audioBuf;
        } else {
            // Fallback: if WAV PCM16, decode and convert to mulaw
            const isWav = audioBuf.length > 12 && audioBuf.toString('ascii', 0, 4) === 'RIFF' && audioBuf.toString('ascii', 8, 12) === 'WAVE';
            if (isWav) {
                console.log('[TTS] Decoding WAV PCM16 → µ-law');
                // Very small WAV parser for PCM16 mono
                let offset = 12; // skip RIFF/WAVE
                let fmtChunkFound = false;
                let dataChunkOffset = -1;
                let dataChunkSize = 0;
                let channels = 1;
                let sampleRate = desiredSampleRate;
                let bitsPerSample = 16;
                let audioFormat = 1; // 1 = PCM, 7 = µ-law

                while (offset + 8 <= audioBuf.length) {
                    const chunkId = audioBuf.toString('ascii', offset, offset + 4);
                    const chunkSize = audioBuf.readUInt32LE(offset + 4);
                    offset += 8;
                    if (chunkId === 'fmt ') {
                        fmtChunkFound = true;
                        audioFormat = audioBuf.readUInt16LE(offset + 0);
                        channels = audioBuf.readUInt16LE(offset + 2);
                        sampleRate = audioBuf.readUInt32LE(offset + 4);
                        bitsPerSample = audioBuf.readUInt16LE(offset + 14);
                        console.log('[TTS] WAV fmt:', { audioFormat, channels, sampleRate, bitsPerSample });
                    } else if (chunkId === 'data') {
                        dataChunkOffset = offset;
                        dataChunkSize = chunkSize;
                        break;
                    }
                    offset += chunkSize;
                }

                if (fmtChunkFound && dataChunkOffset >= 0) {
                    const data = audioBuf.subarray(dataChunkOffset, dataChunkOffset + dataChunkSize);
                    // Handle µ-law WAV directly (format code 7, 8 bits per sample)
                    if (audioFormat === 7) {
                        console.log('[TTS] WAV contains µ-law data; extracting data chunk only');
                        mulawBuffer = data; // already µ-law bytes
                    } else if (audioFormat === 1 && bitsPerSample === 16) {
                        // PCM16: convert to µ-law
                        // No resampling implemented; assume Deepgram honored desiredSampleRate
                        if (channels !== 1) {
                            console.warn('[TTS] WAV has >1 channels; using first channel only');
                        }
                        const mu = Buffer.alloc(Math.floor(data.length / 2));
                        for (let i = 0, j = 0; i + 1 < data.length; i += 2, j++) {
                            const sample = data.readInt16LE(i);
                            mu[j] = linear16ToMuLaw(sample);
                        }
                        mulawBuffer = mu;
                    } else {
                        console.warn('[TTS] Unsupported WAV format; returning original buffer');
                    }
                } else {
                    console.warn('[TTS] Could not parse WAV chunks; returning original audio');
                }
            }
        }

        // Convert to base64 for JSON response
        const base64Audio = audioBuf.toString('base64'); // original (may be WAV)
        const mulawBase64 = (mulawBuffer ?? audioBuf).toString('base64'); // prefer raw µ-law

        console.log('[TTS] Returning audio data');
        return NextResponse.json({
            audioData: base64Audio,
            mulawBase64,
            encoding: mulawBuffer ? 'mulaw' : 'unknown',
            sampleRate: desiredSampleRate,
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