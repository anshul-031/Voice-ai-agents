import { NextRequest, NextResponse } from 'next/server';

/**
 * Speech-to-Text Handler for Exotel Audio
 * 
 * This endpoint downloads audio from Exotel recording URL
 * and transcribes it using AssemblyAI or other STT service
 */

export async function POST(request: NextRequest) {
    console.log('[Telephony STT] POST request received');

    try {
        const { recordingUrl, language } = await request.json();

        if (!recordingUrl) {
            return NextResponse.json(
                { error: 'recordingUrl is required' },
                { status: 400 }
            );
        }

        console.log('[Telephony STT] Processing recording:', recordingUrl);

        // Download audio from Exotel
        const audioResponse = await fetch(recordingUrl);
        
        if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
        }

        const audioBuffer = await audioResponse.arrayBuffer();
        console.log('[Telephony STT] Downloaded audio, size:', audioBuffer.byteLength);

        // Check if AssemblyAI is configured
        const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
        
        if (!assemblyApiKey) {
            console.error('[Telephony STT] AssemblyAI API key not configured');
            return NextResponse.json(
                { error: 'STT service not configured' },
                { status: 500 }
            );
        }

        // Upload audio to AssemblyAI
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'authorization': assemblyApiKey,
                'content-type': 'application/octet-stream',
            },
            body: audioBuffer,
        });

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload to AssemblyAI: ${uploadResponse.statusText}`);
        }

        const { upload_url } = await uploadResponse.json();
        console.log('[Telephony STT] Audio uploaded to AssemblyAI');

        // Request transcription
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': assemblyApiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: upload_url,
                language_code: language || 'hi', // Default to Hindi
            }),
        });

        if (!transcriptResponse.ok) {
            throw new Error(`Failed to request transcription: ${transcriptResponse.statusText}`);
        }

        const { id: transcriptId } = await transcriptResponse.json();
        console.log('[Telephony STT] Transcription requested, ID:', transcriptId);

        // Poll for transcription result
        let transcript: any = null;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const statusResponse = await fetch(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: {
                        'authorization': assemblyApiKey,
                    },
                }
            );

            if (!statusResponse.ok) {
                throw new Error(`Failed to check status: ${statusResponse.statusText}`);
            }

            transcript = await statusResponse.json();
            
            if (transcript.status === 'completed') {
                console.log('[Telephony STT] Transcription completed:', transcript.text);
                break;
            } else if (transcript.status === 'error') {
                throw new Error(`Transcription failed: ${transcript.error}`);
            }
            
            attempts++;
        }

        if (!transcript || transcript.status !== 'completed') {
            throw new Error('Transcription timeout');
        }

        return NextResponse.json({
            success: true,
            text: transcript.text,
            confidence: transcript.confidence,
            language: transcript.language_code,
        });

    } catch (error) {
        console.error('[Telephony STT] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to transcribe audio',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
