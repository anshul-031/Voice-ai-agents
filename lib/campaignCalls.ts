import dbConnect from '@/lib/dbConnect';
import { triggerExotelCall } from '@/lib/exotel';
import Campaign from '@/models/Campaign';
import type { ICampaignContact } from '@/models/CampaignContact';
import type { Types } from 'mongoose';

export async function triggerCampaignCalls(campaignId: string, contacts: ICampaignContact[]) {
    await dbConnect();

    let completedCount = 0;
    let failedCount = 0;

    for (const contact of contacts) {
        try {
            contact.call_status = 'initiated';
            contact.call_started_at = new Date();
            await contact.save();

            const result = await triggerExotelCall({
                phoneNumber: contact.number,
                contactName: contact.name,
                contactId: (contact._id as Types.ObjectId).toString(),
            });

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

            await Campaign.findByIdAndUpdate(campaignId, {
                calls_completed: completedCount,
                calls_failed: failedCount,
                updated_at: new Date(),
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error calling contact ${contact.number}:`, error);

            contact.call_status = 'failed';
            contact.call_error = errorMessage;
            contact.call_ended_at = new Date();
            failedCount++;
            await contact.save();

            await Campaign.findByIdAndUpdate(campaignId, {
                calls_failed: failedCount,
                updated_at: new Date(),
            });
        }
    }

    await Campaign.findByIdAndUpdate(campaignId, {
        status: 'completed',
        updated_at: new Date(),
    });

    console.log(`Campaign ${campaignId} completed. Success: ${completedCount}, Failed: ${failedCount}`);
}
