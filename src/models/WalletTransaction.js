import mongoose from 'mongoose';

const WalletTransactionSchema = new mongoose.Schema({
    userId: {
        type: String, // Clerk ID
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['topup', 'subscription_bonus', 'bid_deduction', 'bid_refund', 'milestone_payout', 'escrow_release'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        default: 600,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending',
    },
    paymentProof: {
        type: String, // Cloudinary URL for manual verification (topups)
    },
    metadata: {
        listingId: String,
        bidId: String,
        notes: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: Date,
});

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.WalletTransaction) {
    delete mongoose.models.WalletTransaction;
}

export default mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', WalletTransactionSchema);
