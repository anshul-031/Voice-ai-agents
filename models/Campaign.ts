import { Document, Schema, model, models } from 'mongoose';

export interface ICampaign extends Document {
    title: string;
    start_date: Date;
    updated_at: Date;
    status: 'running' | 'stopped' | 'completed';
    agent_id: string;
    user_id: string;
}

const CampaignSchema = new Schema<ICampaign>({
    title: {
        type: String,
        required: true,
    },
    start_date: {
        type: Date,
        required: true,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        required: true,
        enum: ['running', 'stopped', 'completed'],
        default: 'running',
    },
    agent_id: {
        type: String,
        required: true,
        default: 'emi reminder',
    },
    user_id: {
        type: String,
        required: true,
    },
});

// Create indexes for efficient querying
CampaignSchema.index({ user_id: 1, updated_at: -1 });
CampaignSchema.index({ status: 1 });

// Use existing model if it exists (for hot reload in development)
const Campaign = models.Campaign || model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
