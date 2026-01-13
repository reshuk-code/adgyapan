
import mongoose from 'mongoose';

const StatSchema = new mongoose.Schema({
    adId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ad',
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    feedViews: {
        type: Number,
        default: 0
    },
    arViews: {
        type: Number,
        default: 0
    },
    hovers: {
        type: Number,
        default: 0,
    },
    clicks: {
        type: Number,
        default: 0,
    },
    totalScreenTime: {
        type: Number, // in seconds
        default: 0,
    },
    countries: [{
        code: String,
        count: { type: Number, default: 0 }
    }],
    cities: [{
        name: String,
        count: { type: Number, default: 0 }
    }],
    hourlyEngagement: [{
        hour: Number, // 0-23
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
    }]
});

// Ensure unique index per ad per day
StatSchema.index({ adId: 1, date: 1 }, { unique: true });

export default mongoose.models.Stat || mongoose.model('Stat', StatSchema);
