
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
    countBothViews: {
        type: Boolean,
        default: false, // Default to AR-only tracking
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

ProfileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
