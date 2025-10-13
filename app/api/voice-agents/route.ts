import dbConnect, { clearMongoConnection } from '@/lib/mongodb';
import VoiceAgent from '@/models/VoiceAgent';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all voice agents for a user
export async function GET(request: NextRequest) {
    console.log('[Voice Agents API] GET request received');

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'mukul';

        try {
            await dbConnect();
        } catch (_connError) {
            console.error('[Voice Agents API] Connection error, clearing cache and retrying...');
            await clearMongoConnection();
            await dbConnect();
        }
        console.log('[Voice Agents API] Connected to MongoDB');

        const agents = await VoiceAgent.find({ userId })
            .sort({ lastUpdated: -1 })
            .lean()
            .exec();

        console.log('[Voice Agents API] Found', agents.length, 'agents for user:', userId);

        return NextResponse.json({
            success: true,
            userId,
            agents: agents.map(agent => ({
                id: (agent._id as any).toString(),
                userId: agent.userId,
                title: agent.title,
                prompt: agent.prompt,
                llmModel: agent.llmModel,
                sttModel: agent.sttModel,
                ttsModel: agent.ttsModel,
                lastUpdated: agent.lastUpdated,
                createdAt: agent.createdAt,
            })),
            count: agents.length,
        });

    } catch (error) {
        console.error('[Voice Agents API] Error fetching agents:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch voice agents',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// POST - Create a new voice agent
export async function POST(request: NextRequest) {
    console.log('[Voice Agents API] POST request received');

    try {
        await dbConnect();
        console.log('[Voice Agents API] Connected to MongoDB');

        const { userId, title, prompt, llmModel, sttModel, ttsModel } = await request.json();
        console.log('[Voice Agents API] Request data:', { userId, title, promptLength: prompt?.length, llmModel, sttModel, ttsModel });

        if (!title || !prompt) {
            console.error('[Voice Agents API] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: title, prompt' },
                { status: 400 }
            );
        }

        const agent = new VoiceAgent({
            userId: userId || 'mukul',
            title: title.trim(),
            prompt: prompt.trim(),
            llmModel: llmModel || 'Gemini 1.5 Flash',
            sttModel: sttModel || 'AssemblyAI Universal',
            ttsModel: ttsModel || 'Sarvam Voice Manisha',
            lastUpdated: new Date(),
            createdAt: new Date(),
        });

        await agent.save();
        console.log('[Voice Agents API] Agent saved successfully, ID:', agent._id);

        return NextResponse.json({
            success: true,
            agent: {
                id: agent._id.toString(),
                userId: agent.userId,
                title: agent.title,
                prompt: agent.prompt,
                llmModel: agent.llmModel,
                sttModel: agent.sttModel,
                ttsModel: agent.ttsModel,
                lastUpdated: agent.lastUpdated,
                createdAt: agent.createdAt,
            },
        });

    } catch (error) {
        console.error('[Voice Agents API] Error creating agent:', error);
        return NextResponse.json(
            {
                error: 'Failed to create voice agent',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// PUT - Update a voice agent
export async function PUT(request: NextRequest) {
    console.log('[Voice Agents API] PUT request received');

    try {
        await dbConnect();

        const { id, title, prompt, llmModel, sttModel, ttsModel } = await request.json();
        console.log('[Voice Agents API] Update request:', { id, title, promptLength: prompt?.length, llmModel, sttModel, ttsModel });

        if (!id || (!title && !prompt && !llmModel && !sttModel && !ttsModel)) {
            return NextResponse.json(
                { error: 'Missing required fields: id and at least one of (title, prompt, llmModel, sttModel, ttsModel)' },
                { status: 400 }
            );
        }

        const updateData: any = { lastUpdated: new Date() };
        if (title) updateData.title = title.trim();
        if (prompt) updateData.prompt = prompt.trim();
        if (llmModel) updateData.llmModel = llmModel;
        if (sttModel) updateData.sttModel = sttModel;
        if (ttsModel) updateData.ttsModel = ttsModel;

        const agent = await VoiceAgent.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!agent) {
            return NextResponse.json(
                { error: 'Voice agent not found' },
                { status: 404 }
            );
        }

        console.log('[Voice Agents API] Agent updated successfully');

        return NextResponse.json({
            success: true,
            agent: {
                id: agent._id.toString(),
                userId: agent.userId,
                title: agent.title,
                prompt: agent.prompt,
                llmModel: agent.llmModel,
                sttModel: agent.sttModel,
                ttsModel: agent.ttsModel,
                lastUpdated: agent.lastUpdated,
                createdAt: agent.createdAt,
            },
        });

    } catch (error) {
        console.error('[Voice Agents API] Error updating agent:', error);
        return NextResponse.json(
            {
                error: 'Failed to update voice agent',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete a voice agent
export async function DELETE(request: NextRequest) {
    console.log('[Voice Agents API] DELETE request received');

    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        const result = await VoiceAgent.findByIdAndDelete(id);

        if (!result) {
            return NextResponse.json(
                { error: 'Voice agent not found' },
                { status: 404 }
            );
        }

        console.log('[Voice Agents API] Agent deleted successfully');

        return NextResponse.json({
            success: true,
            message: 'Voice agent deleted successfully',
        });

    } catch (error) {
        console.error('[Voice Agents API] Error deleting agent:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete voice agent',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
