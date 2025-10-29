import dbConnect from '@/lib/dbConnect';
import { triggerCampaignCalls } from '@/lib/campaignCalls';
import Campaign from '@/models/Campaign';
import CampaignContact from '@/models/CampaignContact';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * POST /api/campaigns/start
 * Starts a campaign by triggering Exotel calls for all contacts
 */
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { campaign_id } = body;

        if (!campaign_id) {
            return NextResponse.json(
                { success: false, error: 'campaign_id is required' },
                { status: 400 },
            );
        }

        // Fetch the campaign
        const campaign = await Campaign.findById(campaign_id);
        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 },
            );
        }

        // Check if campaign is already running
        if (campaign.status === 'running' && campaign.started_at) {
            return NextResponse.json(
                { success: false, error: 'Campaign is already running' },
                { status: 400 },
            );
        }

        // Fetch all contacts for this campaign
        const contacts = await CampaignContact.find({
            campaign_id,
            call_status: { $in: ['pending', 'failed'] }, // Only call pending or failed contacts
        });

        if (contacts.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No contacts found for this campaign' },
                { status: 400 },
            );
        }

        // Update campaign status to running
        campaign.status = 'running';
        campaign.started_at = new Date();
        campaign.total_contacts = contacts.length;
        campaign.calls_completed = 0;
        campaign.calls_failed = 0;
        campaign.updated_at = new Date();
        await campaign.save();

        // Start calling contacts asynchronously
        // This runs in the background without blocking the response
        triggerCampaignCalls(campaign_id, contacts).catch((error: unknown) => {
            console.error('Error in background call processing:', error);
        });

        return NextResponse.json({
            success: true,
            data: {
                campaign_id,
                total_contacts: contacts.length,
                status: 'running',
                message: `Campaign started successfully. Calling ${contacts.length} contacts.`,
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error starting campaign:', error);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 },
        );
    }
}
