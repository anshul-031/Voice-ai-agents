import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IChat extends Document {
    userId: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    systemPrompt?: string;
}

const ChatSchema = new Schema<IChat>({
    userId: {
        type: String,
        required: true,
        index: true,
        default: 'mukul', // Default user for now
    },
    sessionId: {
        type: String,
        required: true,
        index: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'assistant', 'system'],
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    systemPrompt: {
        type: String,
        required: false,
    },
});

// Create compound indexes for efficient querying
ChatSchema.index({ userId: 1, sessionId: 1, timestamp: 1 });
ChatSchema.index({ sessionId: 1, timestamp: 1 });

// Use existing model if it exists (for hot reload in development)
const Chat = models.Chat || model<IChat>('Chat', ChatSchema);

export default Chat;
