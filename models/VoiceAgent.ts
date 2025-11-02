import { Document, Schema, model, models } from 'mongoose';

export interface IAgentKnowledgeItem {
    itemId: string;
    name: string;
    type: 'text' | 'csv';
    size: number;
    content: string;
    preview?: string;
    createdAt: Date;
}

export interface IVoiceAgent extends Document {
    userId: string;
    title: string;
    prompt: string;
    llmModel: string;
    sttModel: string;
    ttsModel: string;
    knowledgeItems: IAgentKnowledgeItem[];
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
    knowledgeItems: {
        type: [
            {
                itemId: {
                    type: String,
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
                type: {
                    type: String,
                    enum: ['text', 'csv'],
                    required: true,
                },
                size: {
                    type: Number,
                    required: true,
                    default: 0,
                },
                content: {
                    type: String,
                    required: true,
                },
                preview: {
                    type: String,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        default: [],
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
