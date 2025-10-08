import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';

export async function POST(request: NextRequest) {
    console.log('[Chat Save] POST request received');

    try {
        await dbConnect();
        console.log('[Chat Save] Connected to MongoDB');

        const { userId, sessionId, role, content, systemPrompt } = await request.json();
        console.log('[Chat Save] Request data:', { userId, sessionId, role, contentLength: content?.length });

        if (!sessionId || !role || !content) {
            console.error('[Chat Save] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, role, content' },
                { status: 400 }
            );
        }

        if (!['user', 'assistant', 'system'].includes(role)) {
            console.error('[Chat Save] Invalid role:', role);
            return NextResponse.json(
                { error: 'Invalid role. Must be user, assistant, or system' },
                { status: 400 }
            );
        }

        const chat = new Chat({
            userId: userId || 'mukul', // Default to 'mukul' if not provided
            sessionId,
            role,
            content,
            systemPrompt,
            timestamp: new Date(),
        });

        await chat.save();
        console.log('[Chat Save] Chat saved successfully, ID:', chat._id);

        return NextResponse.json({
            success: true,
            chatId: chat._id,
            timestamp: chat.timestamp,
        });

    } catch (error) {
        console.error('[Chat Save] Error saving chat:', error);
        return NextResponse.json(
            {
                error: 'Failed to save chat',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
