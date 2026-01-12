
import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    plan: {
        type: String,
        enum: ['basic', 'pro', 'enterprise'],
        default: 'basic',
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'],
        default: 'inactive',
    },
    paymentProof: {
        type: String, // Cloudinary URL
    },
    amount: {
        type: Number,
        default: 0,
    },
    activatedAt: {
        type: Date,
    },
    expiresAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
