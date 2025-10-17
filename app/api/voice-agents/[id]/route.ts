import dbConnect from '@/lib/mongodb';
import VoiceAgent from '@/models/VoiceAgent';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        const agent = await VoiceAgent.findById(id);

        if (!agent) {
            return NextResponse.json(
                { success: false, error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            agent: {
                id: agent._id.toString(),
                title: agent.title,
                prompt: agent.prompt,
                llmModel: agent.llmModel,
                sttModel: agent.sttModel,
                ttsModel: agent.ttsModel,
                userId: agent.userId,
                lastUpdated: agent.lastUpdated,
                createdAt: agent.createdAt,
            },
        });
    } catch (error) {
        console.error('[GET /api/voice-agents/[id]] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch agent' },
            { status: 500 }
        );
    }
}
