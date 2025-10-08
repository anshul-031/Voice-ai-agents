import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IVoiceAgent extends Document {
    userId: string;
    title: string;
    prompt: string;
    lastUpdated: Date;
    createdAt: Date;
}

const VoiceAgentSchema = new Schema<IVoiceAgent>({
    userId: {
        type: String,
        required: true,
        index: true,
        default: 'mukul',
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create index for efficient querying by user
VoiceAgentSchema.index({ userId: 1, lastUpdated: -1 });

// Use existing model if it exists (for hot reload in development)
const VoiceAgent = models.VoiceAgent || model<IVoiceAgent>('VoiceAgent', VoiceAgentSchema);

export default VoiceAgent;
