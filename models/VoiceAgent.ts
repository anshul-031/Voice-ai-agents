import { Document, Schema, model, models } from 'mongoose';

export interface IWhatsAppConfig {
    appId?: string;
    appSecret?: string;
    businessId?: string;
    accessToken?: string;
    phoneNumber?: string;
    enabled?: boolean;
}

export interface IVoiceAgent extends Document {
    userId: string;
    title: string;
    prompt: string;
    llmModel: string;
    sttModel: string;
    ttsModel: string;
    whatsappConfig?: IWhatsAppConfig;
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
        default: 'Sarvam Manisha',
    },
    whatsappConfig: {
        type: {
            appId: String,
            appSecret: String,
            businessId: String,
            accessToken: String,
            phoneNumber: String,
            enabled: {
                type: Boolean,
                default: false,
            },
        },
        required: false,
        default: undefined,
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
