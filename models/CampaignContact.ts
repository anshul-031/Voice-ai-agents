import { Document, Schema, model, models } from 'mongoose';

export interface ICampaignContact extends Document {
    number: string;
    name: string;
    description: string;
    campaign_id: string;
    call_done: 'yes' | 'no';
}

const CampaignContactSchema = new Schema<ICampaignContact>({
    number: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
        default: '',
    },
    campaign_id: {
        type: String,
        required: true,
        index: true,
    },
    call_done: {
        type: String,
        required: true,
        enum: ['yes', 'no'],
        default: 'no',
    },
});

// Create indexes for efficient querying
CampaignContactSchema.index({ campaign_id: 1, call_done: 1 });

// Use existing model if it exists (for hot reload in development)
const CampaignContact = models.CampaignContact || model<ICampaignContact>('CampaignContact', CampaignContactSchema);

export default CampaignContact;
