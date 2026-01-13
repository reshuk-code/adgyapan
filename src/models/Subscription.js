
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

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Subscription) {
    delete mongoose.models.Subscription;
}

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
