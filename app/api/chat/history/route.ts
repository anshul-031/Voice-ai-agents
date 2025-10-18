import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import type { Types } from 'mongoose';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('[Chat History] GET request received');

    try {
        await dbConnect();
        console.log('[Chat History] Connected to MongoDB');

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const skip = parseInt(searchParams.get('skip') || '0', 10);

        if (!sessionId) {
            console.error('[Chat History] No sessionId provided');
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 },
            );
        }

        console.log('[Chat History] Fetching chats for session:', sessionId);

        const chats = await Chat.find({ sessionId })
            .sort({ timestamp: 1 }) // Oldest first
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        console.log('[Chat History] Found', chats.length, 'chats');

        return NextResponse.json({
            success: true,
            sessionId,
            count: chats.length,
            chats: chats.map(chat => ({
                id: (chat._id as Types.ObjectId).toString(),
                role: chat.role,
                content: chat.content,
                timestamp: chat.timestamp,
                systemPrompt: chat.systemPrompt,
            })),
        });

    } catch (error) {
        console.error('[Chat History] Error fetching chat history:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch chat history',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// Optional: Delete chat history for a session
export async function DELETE(request: NextRequest) {
    console.log('[Chat History] DELETE request received');

    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 },
            );
        }

        const result = await Chat.deleteMany({ sessionId });
        console.log('[Chat History] Deleted', result.deletedCount, 'chats for session:', sessionId);

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
        });

    } catch (error) {
        console.error('[Chat History] Error deleting chat history:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete chat history',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
