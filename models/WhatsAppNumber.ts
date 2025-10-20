import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppNumber extends Document {
    userId: string;
    phoneNumber: string;
    phoneNumberId?: string;
    displayName?: string;
    linkedAgentId?: string;
    status: 'active' | 'inactive';
    lastInteractionAt?: Date;
    settings?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const WhatsAppNumberSchema = new Schema<IWhatsAppNumber>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        phoneNumberId: {
            type: String,
            index: true,
        },
        displayName: String,
        linkedAgentId: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        lastInteractionAt: Date,
        settings: Schema.Types.Mixed,
    },
    {
        timestamps: true,
    },
);

WhatsAppNumberSchema.index({ phoneNumberId: 1 });

export default mongoose.models.WhatsAppNumber || mongoose.model<IWhatsAppNumber>('WhatsAppNumber', WhatsAppNumberSchema);
