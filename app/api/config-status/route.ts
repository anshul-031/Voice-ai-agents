import { NextResponse } from 'next/server';

export async function GET() {
    console.log('[config-status] GET request received');
    console.log('[config-status] Checking environment variables...');

    const assemblyAIConfigured = !!process.env.ASSEMBLYAI_API_KEY &&
        process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here';

    const geminiConfigured = !!process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

    const sarvamConfigured = !!process.env.SARVAM_API_KEY &&
        process.env.SARVAM_API_KEY !== 'your_sarvam_api_key_here';

    console.log('[config-status] Configuration status:', {
        stt: assemblyAIConfigured,
        llm: geminiConfigured,
        tts: sarvamConfigured
    });

    const allConfigured = assemblyAIConfigured && geminiConfigured && sarvamConfigured;
    console.log('[config-status] All configured:', allConfigured);

    return NextResponse.json({
        services: {
            stt: assemblyAIConfigured,
            llm: geminiConfigured,
            tts: sarvamConfigured
        },
        allConfigured: allConfigured,
        message: allConfigured
            ? 'All services configured successfully!'
            : 'Some API keys are missing or using placeholder values'
    });
}