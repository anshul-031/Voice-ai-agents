import { NextRequest, NextResponse } from 'next/server';

// TODO: Add rate limiting to prevent API abuse
// TODO: Add input validation for audio file size/type
// TODO: Consider adding audio format conversion if needed

export async function POST(request: NextRequest) {
    console.log('[upload-audio] POST request received');

    try {
        const contentType = request.headers.get('content-type') || '';
        let audioBuffer: Buffer | Uint8Array | null = null;
        let source: 'json-base64' | 'form-file' | null = null;

        if (contentType.includes('application/json')) {
            console.log('[upload-audio] Parsing JSON body...');
            const body = await request.json();
            const base64 = body?.audio || body?.audioData || body?.wavBase64;
            if (!base64 || typeof base64 !== 'string') {
                console.error('[upload-audio] Missing base64 audio in JSON (expected audio | audioData | wavBase64)');
                return NextResponse.json({ error: 'Missing base64 audio' }, { status: 400 });
            }
            audioBuffer = Buffer.from(base64, 'base64');
            source = 'json-base64';
        } else {
            console.log('[upload-audio] Parsing form data...');
            const formData = await request.formData();
            const audioFile = formData.get('audio') as File;

            if (!audioFile) {
                console.error('[upload-audio] No audio file provided in request');
                return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
            }
            const arr = await audioFile.arrayBuffer();
            audioBuffer = Buffer.from(arr);
            source = 'form-file';
            // Debug: Log audio file info
            console.log('[upload-audio] Received audio file:', {
                name: audioFile.name,
                size: audioFile.size,
                type: (audioFile as any).type
            });
        }

        const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!assemblyApiKey) {
            console.error('[upload-audio] AssemblyAI API key not configured');
            return NextResponse.json({ error: 'Speech-to-text service not configured' }, { status: 500 });
        }

        // Validate audio
        if (!audioBuffer || (audioBuffer as any).length === 0) {
            console.error('[upload-audio] Empty audio payload received');
            return NextResponse.json({ error: 'Empty audio payload received' }, { status: 400 });
        }

        // Step 1: Upload audio file to AssemblyAI
        console.log('[upload-audio] Step 1: Uploading to AssemblyAI...');
    console.log('[upload-audio] Audio source:', source);
    console.log('[upload-audio] Audio buffer size:', (audioBuffer as any).length, 'bytes');

        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey,
                'Content-Type': 'application/octet-stream',
            },
            body: audioBuffer as any,
        });

        console.log('[upload-audio] Upload response status:', uploadResponse.status);

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('[upload-audio] AssemblyAI upload failed:', errorText);
            return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
        }

        const uploadResult = await uploadResponse.json();
        const audioUrl = uploadResult.upload_url;
        console.log('[upload-audio] Audio uploaded successfully, URL:', audioUrl);

        // Step 2: Create transcription job
        console.log('[upload-audio] Step 2: Creating transcription job...');
        const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: audioUrl,
                speech_model: 'best', // Using 'best' for higher accuracy
                language_detection: true, // Automatically detect language
                entity_detection: true, // Better entity recognition
                punctuate: true, // Add proper punctuation
                format_text: true // Apply formatting to improve readability
            }),
        });

        console.log('[upload-audio] Transcription job response status:', transcriptionResponse.status);

        if (!transcriptionResponse.ok) {
            const errorText = await transcriptionResponse.text();
            console.error('[upload-audio] AssemblyAI transcription request failed:', errorText);
            return NextResponse.json({ error: 'Failed to create transcription job' }, { status: 500 });
        }

        const transcriptionJob = await transcriptionResponse.json();
        const transcriptId = transcriptionJob.id;
        console.log('[upload-audio] Transcription job created, ID:', transcriptId);

        // Step 3: Poll for completion
        console.log('[upload-audio] Step 3: Polling for transcription completion...');
        // TODO: Consider using webhooks for production to avoid polling
        const maxAttempts = 60; // 5 minutes max wait time
        let attempts = 0;
        let delay = 1000; // Start with 1 second delay

        while (attempts < maxAttempts) {
            console.log(`[upload-audio] Polling attempt ${attempts + 1}/${maxAttempts}...`);

            const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'Authorization': assemblyApiKey,
                },
            });

            console.log('[upload-audio] Status check response:', statusResponse.status);

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                console.error('[upload-audio] AssemblyAI status check failed:', errorText);
                return NextResponse.json({ error: 'Failed to check transcription status' }, { status: 500 });
            }

            const result = await statusResponse.json();
            console.log('[upload-audio] Transcription status:', result.status);

            if (result.status === 'completed') {
                console.log('[upload-audio] Transcription completed successfully');
                console.log('[upload-audio] Transcribed text:', result.text);
                return NextResponse.json({
                    text: result.text || '',
                    transcriptId: transcriptId,
                });
            } else if (result.status === 'error') {
                console.error('[upload-audio] AssemblyAI transcription error:', result.error);
                return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
            }

            // Wait before next attempt (exponential backoff)
            console.log(`[upload-audio] Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, 5000); // Cap at 5 seconds
            attempts++;
        }

        console.error('[upload-audio] Transcription timeout after', maxAttempts, 'attempts');
        return NextResponse.json({ error: 'Transcription timeout' }, { status: 408 });

    } catch (error) {
        console.error('[upload-audio] Unexpected error:', error);
        if (error instanceof Error) {
            console.error('[upload-audio] Error message:', error.message);
            console.error('[upload-audio] Error stack:', error.stack);
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}