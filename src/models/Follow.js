
import mongoose from 'mongoose';

const FollowSchema = new mongoose.Schema({
    followerId: {
        type: String,
        required: true,
        index: true
    },
    followingId: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only follow another user once
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.models.Follow || mongoose.model('Follow', FollowSchema);
