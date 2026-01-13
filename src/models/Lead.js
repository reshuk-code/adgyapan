import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
    adId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ad',
        required: [true, 'Ad reference is required']
    },
    userId: {
        type: String,
        required: [true, 'Campaign owner user ID is required']
    },
    leadData: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        company: { type: String },
        message: { type: String }
    },
    source: {
        type: String,
        enum: ['ar_view', 'feed_view', 'embed'],
        default: 'ar_view'
    },
    metadata: {
        ip: { type: String },
        userAgent: { type: String },
        referrer: { type: String }
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'converted', 'archived'],
        default: 'new'
    },
    notes: {
        type: String,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp on save
LeadSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
LeadSchema.index({ userId: 1, createdAt: -1 });
LeadSchema.index({ adId: 1, createdAt: -1 });
LeadSchema.index({ status: 1 });

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Lead) {
    delete mongoose.models.Lead;
}

const LeadModel = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

export default LeadModel;
