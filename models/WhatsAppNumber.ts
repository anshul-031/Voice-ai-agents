import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppNumber extends Document {
    userId: string;
    displayName: string;
    phoneNumber: string;
    phoneNumberId: string;
    appId: string;
    appSecret: string;
    businessId: string;
    accessToken: string;
    linkedAgentId?: string;
    status: 'active' | 'inactive' | 'error' | 'pending';
    lastUsed?: Date;
    webhookUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppNumberSchema: Schema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
            default: 'mukul',
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumberId: {
            type: String,
            required: true,
            unique: true,
        },
        appId: {
            type: String,
            required: true,
        },
        appSecret: {
            type: String,
            required: true,
        },
        businessId: {
            type: String,
            required: true,
        },
        accessToken: {
            type: String,
            required: true,
        },
        linkedAgentId: {
            type: String,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'error', 'pending'],
            default: 'pending',
        },
        lastUsed: {
            type: Date,
        },
        webhookUrl: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

WhatsAppNumberSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
WhatsAppNumberSchema.index({ phoneNumberId: 1 }, { unique: true });
WhatsAppNumberSchema.index({ linkedAgentId: 1 });

export default mongoose.models.WhatsAppNumber || mongoose.model<IWhatsAppNumber>('WhatsAppNumber', WhatsAppNumberSchema);
