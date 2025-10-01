import { NextResponse } from 'next/server';

export async function GET() {
    const assemblyAIConfigured = !!process.env.ASSEMBLYAI_API_KEY &&
        process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here';

    const geminiConfigured = !!process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

    const deepgramConfigured = !!process.env.DEEPGRAM_API_KEY &&
        process.env.DEEPGRAM_API_KEY !== 'your_deepgram_api_key_here';

    return NextResponse.json({
        services: {
            stt: assemblyAIConfigured,
            llm: geminiConfigured,
            tts: deepgramConfigured
        },
        allConfigured: assemblyAIConfigured && geminiConfigured && deepgramConfigured,
        message: assemblyAIConfigured && geminiConfigured && deepgramConfigured
            ? 'All services configured successfully!'
            : 'Some API keys are missing or using placeholder values'
    });
}