
import mongoose from 'mongoose';

const AdSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'Please provide a reference to the advertiser (Clerk ID)'],
    },
    title: {
        type: String,
        required: [true, 'Please provide a title for the ad campaign'],
        maxlength: [60, 'Title cannot be more than 60 characters'],
    },
    imageUrl: {
        type: String,
        required: [true, 'Please provide the static ad image URL'],
    },
    videoUrl: {
        type: String,
        required: [true, 'Please provide the overlay video URL'],
    },
    targetUrl: {
        type: String,
        required: [true, 'Please provide the MindAR target URL'],
    },
    overlay: {
        scale: { type: Number, default: 1 },
        opacity: { type: Number, default: 1 },
        aspectRatio: { type: Number, default: 1.777 },
        rotation: { type: Number, default: 0 },
        rotationX: { type: Number, default: 0 },
        rotationY: { type: Number, default: 0 },
        positionX: { type: Number, default: 0 },
        positionY: { type: Number, default: 0 },
        preset: { type: String, enum: ['standard', 'glass', 'neon', 'frosted'], default: 'standard' },
        behavior: { type: String, enum: ['static', 'float', 'pulse', 'glitch'], default: 'float' },
        environment: { type: String, enum: ['studio', 'outdoor', 'night', 'cyberpunk'], default: 'studio' },
        showQR: { type: Boolean, default: true }
    },
    category: {
        type: String,
        enum: ['tech', 'comedy', 'drama', 'lifestyle', 'fashion', 'education', 'entertainment', 'other'],
        default: 'other'
    },
    authorName: { type: String },
    authorAvatar: { type: String },
    isPublished: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    shares: { type: Number, default: 0 },
    referrers: {
        type: [{
            url: { type: String, required: true },
            count: { type: Number, default: 1 }
        }],
        default: []
    },
    comments: {
        type: [{
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            userAvatar: { type: String },
            text: { type: String, required: true },
            likes: { type: Number, default: 0 },
            likedBy: { type: [String], default: [] },
            replies: [{
                userId: { type: String, required: true },
                userName: { type: String, required: true },
                userAvatar: { type: String },
                text: { type: String, required: true },
                createdAt: { type: Date, default: Date.now }
            }],
            createdAt: { type: Date, default: Date.now }
        }],
        default: []
    },
    slug: {
        type: String,
        unique: [true, 'Slug must be unique'],
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    feedViewCount: { type: Number, default: 0 },
    arViewCount: { type: Number, default: 0 },
    hoverCount: {
        type: Number,
        default: 0,
    },
    clickCount: {
        type: Number,
        default: 0,
    },
    countBothViews: { type: Boolean, default: false },
    isPersistent: { type: Boolean, default: false },
    ctaText: { type: String, maxlength: 20 },
    ctaUrl: { type: String },
    ctaType: {
        type: String,
        enum: ['link', 'lead_form', 'phone', 'email'],
        default: 'link'
    },
    leadFormFields: {
        type: [String],
        enum: ['name', 'email', 'phone', 'company', 'message'],
        default: []
    },
    leadWebhook: { type: String },
    leadCount: { type: Number, default: 0 },
    ctaPositionX: { type: Number, default: 0 },
    ctaPositionY: { type: Number, default: -0.5 },
    ctaScale: { type: Number, default: 0.15 },
    ctaColor: { type: String, default: '#FFD700' },
    ctaBorderRadius: { type: Number, default: 4 },
    // Multiple CTA Buttons
    ctaButtons: {
        type: [{
            text: { type: String, maxlength: 20 },
            url: { type: String },
            type: {
                type: String,
                enum: ['link', 'lead_form', 'phone', 'email'],
                default: 'link'
            },
            positionX: { type: Number, default: 0 },
            positionY: { type: Number, default: -0.5 },
            scale: { type: Number, default: 0.15 },
            color: { type: String, default: '#FFD700' },
            borderRadius: { type: Number, default: 4 }
        }],
        default: [],
        validate: [arrayLimit, 'Cannot have more than 5 CTA buttons']
    },
    showCtaButtons: { type: Boolean, default: true },
    // Thumbnail Hash for Duplicate Detection
    thumbnailHash: { type: String, sparse: true },
    // AR Camera Views
    arCameraViewCount: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Validator for CTA buttons array limit
function arrayLimit(val) {
    return val.length <= 5;
}

// Pre-save hook for thumbnail hash validation
AdSchema.pre('save', async function () {
    // Only check for duplicates if thumbnailHash is being set/modified
    if (this.isModified('thumbnailHash') && this.thumbnailHash) {
        const existingAd = await mongoose.models.Ad.findOne({
            thumbnailHash: this.thumbnailHash,
            _id: { $ne: this._id }
        });

        if (existingAd) {
            const error = new Error('An ad with this thumbnail already exists. Please use a different thumbnail to avoid conflicts.');
            error.code = 'DUPLICATE_THUMBNAIL';
            throw error;
        }
    }

});

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Ad) {
    delete mongoose.models.Ad;
}

const AdModel = mongoose.models.Ad || mongoose.model('Ad', AdSchema);

export default AdModel;
