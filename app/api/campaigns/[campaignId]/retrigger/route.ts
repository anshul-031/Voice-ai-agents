import { triggerCampaignCalls } from '@/app/api/campaigns/start/route';
import dbConnect from '@/lib/dbConnect';
import Campaign from '@/models/Campaign';
import CampaignContact from '@/models/CampaignContact';
import { NextResponse, type NextRequest } from 'next/server';

interface RouteParams {
    campaignId: string;
}

const successResponse = (campaignId: string, totalContacts: number) => NextResponse.json({
    success: true,
    data: {
        campaign_id: campaignId,
        total_contacts: totalContacts,
        status: 'running',
        message: 'Campaign retriggered successfully.',
    },
});

const errorResponse = (message: string, status = 400) => NextResponse.json({
    success: false,
    error: message,
}, { status });

export async function POST(_request: NextRequest, context: { params: Promise<RouteParams> }) {
    const { campaignId } = await context.params;

    if (!campaignId) {
        return errorResponse('Campaign ID is required', 400);
    }

    try {
        await dbConnect();

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return errorResponse('Campaign not found', 404);
        }

        const contacts = await CampaignContact.find({ campaign_id: campaignId });
        if (!contacts.length) {
            return errorResponse('No contacts found for this campaign', 400);
        }

        await CampaignContact.updateMany(
            { campaign_id: campaignId },
            {
                $set: {
                    call_done: 'no',
                    call_status: 'pending',
                },
                $unset: {
                    call_sid: '',
                    call_started_at: '',
                    call_ended_at: '',
                    call_error: '',
                },
            },
        );

        const refreshedContacts = await CampaignContact.find({ campaign_id: campaignId });
        campaign.status = 'running';
        campaign.started_at = new Date();
        campaign.updated_at = new Date();
        campaign.total_contacts = refreshedContacts.length;
        campaign.calls_completed = 0;
        campaign.calls_failed = 0;
        await campaign.save();

        triggerCampaignCalls(campaignId, refreshedContacts).catch(error => {
            console.error('Error retriggering campaign in background:', error);
        });

        return successResponse(campaignId, refreshedContacts.length);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to retrigger campaign';
        console.error('Error retriggering campaign:', error);
        return errorResponse(message, 500);
    }
}
