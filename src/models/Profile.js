
import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    bio: {
        type: String,
        maxlength: 160,
        default: '',
    },
    instagram: {
        type: String,
        default: '',
    },
    twitter: {
        type: String,
        default: '',
    },
    website: {
        type: String,
        default: '',
    },
    // KYC Fields
    kycStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
    },
    legalName: String,
    phone: String,
    dob: Date,
    nationality: String,
    address: String,
    idType: {
        type: String, // NID, Driving License, Passport
        enum: ['NID', 'Driving License', 'Passport', '']
    },
    idNumber: String,
    idImageUrl: String,
    kycSubmissionDate: Date,

    // Wallet Fields
    walletBalance: {
        type: Number,
        default: 0,
    },
    totalEarned: {
        type: Number,
        default: 0,
    },
    countBothViews: {
        type: Boolean,
        default: false, // Default to AR-only tracking
    },
    interestScores: {
        type: Map,
        of: Number,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

ProfileSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

export default mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
