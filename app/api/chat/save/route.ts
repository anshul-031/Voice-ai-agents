import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('[Chat Save] POST request received');

    try {
        await dbConnect();
        console.log('[Chat Save] Connected to MongoDB');

        const { userId, sessionId, messages, systemPrompt } = await request.json();
        console.log('[Chat Save] Request data:', { userId, sessionId, messagesLength: messages?.length });

        if (!sessionId || !messages || !Array.isArray(messages) || messages.length === 0) {
            console.error('[Chat Save] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, messages' },
                { status: 400 },
            );
        }

        // Filter only user and assistant messages
        const filteredMessages = messages.filter(
            msg => ['user', 'assistant'].includes(msg.role),
        );

        if (filteredMessages.length === 0) {
            console.error('[Chat Save] No valid user/assistant messages to save');
            return NextResponse.json(
                { error: 'No valid user/assistant messages to save' },
                { status: 400 },
            );
        }

        // Store one log per session with all filtered messages
        const chat = new Chat({
            userId: userId || 'mukul',
            sessionId,
            content: JSON.stringify(filteredMessages), // Store as JSON string
            systemPrompt,
            timestamp: new Date(),
        });

        await chat.save();
        console.log('[Chat Save] Session chat saved successfully, ID:', chat._id);

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
            { status: 500 },
        );
    }
}
