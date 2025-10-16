import { Document, Schema, model, models } from 'mongoose';

export interface IVoiceAgent extends Document {
    userId: string;
    title: string;
    prompt: string;
    llmModel: string;
    sttModel: string;
    ttsModel: string;
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
    llmModel: {
        type: String,
        required: true,
        default: 'Gemini 1.5 Flash',
    },
    sttModel: {
        type: String,
        required: true,
        default: 'AssemblyAI Universal',
    },
    ttsModel: {
        type: String,
        required: true,
        default: 'Deepgram Aura Luna',
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
