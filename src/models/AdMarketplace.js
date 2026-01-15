import mongoose from 'mongoose';

const AdMarketplaceSchema = new mongoose.Schema({
    adId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ad',
        required: true,
    },
    sellerId: {
        type: String, // Clerk ID
        required: true,
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0,
    },
    targetViews: {
        type: Number,
        required: true,
        default: 100,
    },
    status: {
        type: String,
        enum: ['open', 'pending_acceptance', 'sold', 'closed'],
        default: 'open',
    },
    currentHighestBid: {
        type: Number,
        default: 0,
    },
    winnerId: {
        type: String, // Clerk ID
    },
    apiKey: {
        type: String,
        unique: true,
        sparse: true,
    },
    pin: {
        type: String,
        minlength: 4,
        maxlength: 6,
    },
    externalViews: {
        type: Number,
        default: 0,
    },
    expiryDate: {
        type: Date,
    },
    // Buyer Takeover Fields
    buyerCtaUrl: String,
    buyerCtaText: String,
    buyerCtaType: {
        type: String,
        enum: ['link', 'phone', 'email', 'lead_form'],
        default: 'link'
    },
    buyerLeadFormFields: [String], // ['name', 'email', 'phone', 'message', 'company']
    currentEarnings: {
        type: Number,
        default: 0
    },
    leadsCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.AdMarketplace) {
    delete mongoose.models.AdMarketplace;
}

export default mongoose.models.AdMarketplace || mongoose.model('AdMarketplace', AdMarketplaceSchema);
