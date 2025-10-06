import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[config-status] GET request received');
    console.log('[config-status] Checking environment variables...');

    const assemblyAIConfigured = !!process.env.ASSEMBLYAI_API_KEY &&
        process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here';

    const geminiConfigured = !!process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

    const deepgramConfigured = !!process.env.DEEPGRAM_API_KEY &&
        process.env.DEEPGRAM_API_KEY !== 'your_deepgram_api_key_here';

    console.log('[config-status] Configuration status:', {
        stt: assemblyAIConfigured,
        llm: geminiConfigured,
        tts: deepgramConfigured
    });

    const allConfigured = assemblyAIConfigured && geminiConfigured && deepgramConfigured;
    console.log('[config-status] All configured:', allConfigured);

    return NextResponse.json({
        services: {
            stt: assemblyAIConfigured,
            llm: geminiConfigured,
            tts: deepgramConfigured
        },
        allConfigured: allConfigured,
        message: allConfigured
            ? 'All services configured successfully!'
            : 'Some API keys are missing or using placeholder values'
    });
}