import { NextRequest, NextResponse } from 'next/server';

// TODO: Add rate limiting to prevent API abuse
// TODO: Add input validation for audio file size/type
// TODO: Consider adding audio format conversion if needed

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!assemblyApiKey) {
            console.error('AssemblyAI API key not configured');
            return NextResponse.json({ error: 'Speech-to-text service not configured' }, { status: 500 });
        }

        // Debug: Log audio file info
        console.log('Received audio file:', {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type
        });

        // Validate audio file
        if (audioFile.size === 0) {
            return NextResponse.json({ error: 'Empty audio file received' }, { status: 400 });
        }

        // Step 1: Upload audio file to AssemblyAI
        // Convert file to buffer for proper upload
        const audioBuffer = await audioFile.arrayBuffer();

        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey,
                'Content-Type': 'application/octet-stream',
            },
            body: audioBuffer,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('AssemblyAI upload failed:', errorText);
            return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
        }

        const uploadResult = await uploadResponse.json();
        const audioUrl = uploadResult.upload_url;

        // Step 2: Create transcription job
        const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': assemblyApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: audioUrl,
                speech_model: 'universal', // TODO: Consider using 'best' for higher accuracy
            }),
        });

        if (!transcriptionResponse.ok) {
            const errorText = await transcriptionResponse.text();
            console.error('AssemblyAI transcription request failed:', errorText);
            return NextResponse.json({ error: 'Failed to create transcription job' }, { status: 500 });
        }

        const transcriptionJob = await transcriptionResponse.json();
        const transcriptId = transcriptionJob.id;

        // Step 3: Poll for completion
        // TODO: Consider using webhooks for production to avoid polling
        const maxAttempts = 60; // 5 minutes max wait time
        let attempts = 0;
        let delay = 1000; // Start with 1 second delay

        while (attempts < maxAttempts) {
            const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'Authorization': assemblyApiKey,
                },
            });

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                console.error('AssemblyAI status check failed:', errorText);
                return NextResponse.json({ error: 'Failed to check transcription status' }, { status: 500 });
            }

            const result = await statusResponse.json();

            if (result.status === 'completed') {
                return NextResponse.json({
                    text: result.text || '',
                    transcriptId: transcriptId,
                });
            } else if (result.status === 'error') {
                console.error('AssemblyAI transcription error:', result.error);
                return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
            }

            // Wait before next attempt (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, 5000); // Cap at 5 seconds
            attempts++;
        }

        return NextResponse.json({ error: 'Transcription timeout' }, { status: 408 });

    } catch (error) {
        console.error('Upload audio error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}