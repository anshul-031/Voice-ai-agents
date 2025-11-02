import { Document, Schema, model, models } from 'mongoose';

export interface IPayment extends Document {
    transaction_id: string;
    mer_ref_id?: string;
    account_id?: string;
    payment_status: 'successful' | 'failed' | 'pending' | 'processing';
    payment_date: Date;
    description: string;
    amount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
    transaction_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    mer_ref_id: {
        type: String,
        index: true,
    },
    account_id: {
        type: String,
        index: true,
    },
    payment_status: {
        type: String,
        required: true,
        enum: ['successful', 'failed', 'pending', 'processing'],
    },
    payment_date: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
});

// Create indexes for efficient lookups
PaymentSchema.index({ mer_ref_id: 1 });
PaymentSchema.index({ account_id: 1 });
PaymentSchema.index({ createdAt: -1 });

export default models.Payment || model<IPayment>('Payment', PaymentSchema);