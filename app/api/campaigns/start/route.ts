import dbConnect from '@/lib/dbConnect';
import { triggerExotelCall } from '@/lib/exotel';
import Campaign from '@/models/Campaign';
import CampaignContact, { type ICampaignContact } from '@/models/CampaignContact';
import type { Types } from 'mongoose';
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
        triggerCampaignCalls(campaign_id, contacts).catch(error => {
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

/**
 * Background process to trigger calls for all contacts
 */
export async function triggerCampaignCalls(campaignId: string, contacts: ICampaignContact[]) {
    await dbConnect();

    let completedCount = 0;
    let failedCount = 0;

    for (const contact of contacts) {
        try {
            // Update contact status to initiated
            contact.call_status = 'initiated';
            contact.call_started_at = new Date();
            await contact.save();

            // Trigger Exotel call
            const result = await triggerExotelCall({
                phoneNumber: contact.number,
                contactName: contact.name,
                contactId: (contact._id as Types.ObjectId).toString(),
            });

            // Update contact based on result
            if (result.success) {
                contact.call_status = 'completed';
                contact.call_done = 'yes';
                contact.call_sid = result.callSid;
                contact.call_ended_at = new Date();
                completedCount++;
            } else {
                contact.call_status = 'failed';
                contact.call_error = result.error;
                contact.call_ended_at = new Date();
                failedCount++;
            }
            await contact.save();

            // Update campaign progress
            await Campaign.findByIdAndUpdate(campaignId, {
                calls_completed: completedCount,
                calls_failed: failedCount,
                updated_at: new Date(),
            });

            // Add delay between calls (2 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error calling contact ${contact.number}:`, error);

            // Mark contact as failed
            contact.call_status = 'failed';
            contact.call_error = errorMessage;
            contact.call_ended_at = new Date();
            failedCount++;
            await contact.save();

            // Update campaign progress
            await Campaign.findByIdAndUpdate(campaignId, {
                calls_failed: failedCount,
                updated_at: new Date(),
            });
        }
    }

    // Mark campaign as completed
    await Campaign.findByIdAndUpdate(campaignId, {
        status: 'completed',
        updated_at: new Date(),
    });

    console.log(`Campaign ${campaignId} completed. Success: ${completedCount}, Failed: ${failedCount}`);
}
