import { Document, Model, Schema, model, models } from 'mongoose';

export type WhatsAppMessageDirection = 'inbound' | 'outbound';
export type WhatsAppMessageType = 'text' | 'image' | 'audio' | 'document' | 'unsupported';

export interface IWhatsAppMessage extends Document {
    sessionId: string;
    phoneNumber: string;
    direction: WhatsAppMessageDirection;
    messageType: WhatsAppMessageType;
    content: string;
    messageId?: string;
    agentId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    expiresAt: Date;
}

const metadataType: any = (Schema as unknown as { Types?: { Mixed?: unknown } }).Types?.Mixed || Object;

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
    {
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            index: true,
        },
        direction: {
            type: String,
            enum: ['inbound', 'outbound'],
            required: true,
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'audio', 'document', 'unsupported'],
            default: 'text',
        },
        content: {
            type: String,
            required: true,
        },
        messageId: String,
        agentId: String,
        metadata: metadataType,
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
            index: { expires: 0 },
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

WhatsAppMessageSchema.index({ sessionId: 1, createdAt: 1 });

const WhatsAppMessageModel =
    (models?.WhatsAppMessage as Model<IWhatsAppMessage> | undefined) ||
    model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);

export default WhatsAppMessageModel;
