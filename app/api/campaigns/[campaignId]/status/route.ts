import dbConnect from '@/lib/dbConnect';
import Campaign from '@/models/Campaign';
import { NextResponse, type NextRequest } from 'next/server';

interface RouteParams {
    campaignId: string;
}

/**
 * GET /api/campaigns/[campaignId]/status
 * Fetches the current status and progress of a campaign
 */
export async function GET(_request: NextRequest, context: { params: Promise<RouteParams> }) {
    const { campaignId } = await context.params;

    if (!campaignId) {
        return NextResponse.json(
            { success: false, error: 'Campaign ID is required' },
            { status: 400 },
        );
    }

    try {
        await dbConnect();

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                _id: campaign._id,
                title: campaign.title,
                status: campaign.status,
                total_contacts: campaign.total_contacts,
                calls_completed: campaign.calls_completed,
                calls_failed: campaign.calls_failed,
                started_at: campaign.started_at,
                updated_at: campaign.updated_at,
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching campaign status:', error);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 },
        );
    }
}
