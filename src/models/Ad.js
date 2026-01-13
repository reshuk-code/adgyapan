
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
    ctaText: { type: String, maxlength: 20 },
    ctaUrl: { type: String },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Ad) {
    delete mongoose.models.Ad;
}

const AdModel = mongoose.models.Ad || mongoose.model('Ad', AdSchema);

export default AdModel;
