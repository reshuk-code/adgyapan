
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true // Recipient
    },
    actorId: {
        type: String,
        required: true // Triggerer
    },
    actorName: String,
    actorAvatar: String,
    type: {
        type: String,
        enum: ['follow', 'like', 'comment', 'reply'],
        required: true
    },
    entityId: {
        type: String, // Ad ID or Comment ID
        index: true
    },
    message: String,
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
