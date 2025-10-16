import { Document, Schema, model, models } from 'mongoose';

export interface ICampaignContact extends Document {
    number: string;
    name: string;
    description: string;
    campaign_id: string;
    call_done: 'yes' | 'no';
    call_status: 'pending' | 'initiated' | 'completed' | 'failed';
    call_sid?: string;
    call_started_at?: Date;
    call_ended_at?: Date;
    call_error?: string;
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
    call_status: {
        type: String,
        required: true,
        enum: ['pending', 'initiated', 'completed', 'failed'],
        default: 'pending',
    },
    call_sid: {
        type: String,
        required: false,
    },
    call_started_at: {
        type: Date,
        required: false,
    },
    call_ended_at: {
        type: Date,
        required: false,
    },
    call_error: {
        type: String,
        required: false,
    },
});

// Create indexes for efficient querying
CampaignContactSchema.index({ campaign_id: 1, call_done: 1 });

// Use existing model if it exists (for hot reload in development)
const CampaignContact = models.CampaignContact || model<ICampaignContact>('CampaignContact', CampaignContactSchema);

export default CampaignContact;
