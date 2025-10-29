import { Schema, model, models, type Document } from 'mongoose';

export interface IAgentToolHeader {
    key: string;
    value: string;
}

export interface IAgentToolParameter {
    name: string;
    description?: string;
    type?: string;
    required?: boolean;
}

export interface IAgentTool extends Document {
    userId: string;
    agentId?: string;
    name: string;
    description?: string;
    webhookUrl: string;
    method: 'GET' | 'POST';
    headers: IAgentToolHeader[];
    parameters: IAgentToolParameter[];
    triggerPhrases: string[];
    successMessage?: string;
    failureMessage?: string;
    runAfterCall: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HeaderSchema = new Schema<IAgentToolHeader>({
    key: {
        type: String,
        required: true,
        trim: true,
    },
    value: {
        type: String,
        required: true,
    },
}, { _id: false });

const ParameterSchema = new Schema<IAgentToolParameter>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        default: 'string',
    },
    required: {
        type: Boolean,
        default: false,
    },
}, { _id: false });

const AgentToolSchema = new Schema<IAgentTool>({
    userId: {
        type: String,
        required: true,
        index: true,
        default: 'mukul',
    },
    agentId: {
        type: String,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    webhookUrl: {
        type: String,
        required: true,
    },
    method: {
        type: String,
        enum: ['GET', 'POST'],
        required: true,
        default: 'POST',
    },
    headers: {
        type: [HeaderSchema],
        default: [],
    },
    parameters: {
        type: [ParameterSchema],
        default: [],
    },
    triggerPhrases: {
        type: [String],
        default: [],
    },
    successMessage: {
        type: String,
        trim: true,
    },
    failureMessage: {
        type: String,
        trim: true,
    },
    runAfterCall: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

AgentToolSchema.index({ agentId: 1, name: 1 });

const AgentTool = models.AgentTool || model<IAgentTool>('AgentTool', AgentToolSchema);

export default AgentTool;
