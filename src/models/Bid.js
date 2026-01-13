import mongoose from 'mongoose';

const BidSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdMarketplace',
        required: true,
    },
    bidderId: {
        type: String, // Clerk ID
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['active', 'accepted', 'outbid', 'withdrawn', 'completed'],
        default: 'active',
    },
    escrowStatus: {
        type: String,
        enum: ['held', 'released', 'refunded', 'none'],
        default: 'none',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Bid) {
    delete mongoose.models.Bid;
}

export default mongoose.models.Bid || mongoose.model('Bid', BidSchema);
