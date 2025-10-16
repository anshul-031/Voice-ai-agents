import dbConnect, { clearMongoConnection } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('[Sessions API] GET request received');

    try {
        // Get userId from query params (default to 'mukul' for now)
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'mukul';

        console.log('[Sessions API] Fetching sessions for userId:', userId);

        // Connect to MongoDB
        try {
            await dbConnect();
        } catch (_connError) {
            console.error('[Sessions API] Connection error, clearing cache and retrying...');
            await clearMongoConnection();
            await dbConnect();
        }

        // Aggregate to get unique sessions with metadata
        const sessions = await Chat.aggregate([
            // Filter by userId
            { $match: { userId } },

            // Sort by timestamp to get latest message in each session
            { $sort: { timestamp: -1 } },

            // Group by sessionId to get session metadata
            {
                $group: {
                    _id: '$sessionId',
                    sessionId: { $first: '$sessionId' },
                    userId: { $first: '$userId' },
                    messageCount: { $sum: 1 },
                    firstMessage: { $last: '$content' }, // Last in sorted order (oldest)
                    lastMessage: { $first: '$content' }, // First in sorted order (newest)
                    lastTimestamp: { $first: '$timestamp' },
                    firstTimestamp: { $last: '$timestamp' },
                }
            },

            // Sort sessions by most recent activity
            { $sort: { lastTimestamp: -1 } },

            // Project only needed fields
            {
                $project: {
                    _id: 0,
                    sessionId: 1,
                    userId: 1,
                    messageCount: 1,
                    firstMessage: 1,
                    lastMessage: 1,
                    lastTimestamp: 1,
                    firstTimestamp: 1,
                }
            }
        ]);

        console.log('[Sessions API] Found', sessions.length, 'sessions for user:', userId);

        return NextResponse.json({
            success: true,
            userId,
            sessions,
            count: sessions.length
        });

    } catch (error) {
        console.error('[Sessions API] Error fetching sessions:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch sessions',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
