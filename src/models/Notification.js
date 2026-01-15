
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
    actorIsPro: Boolean,
    type: {
        type: String,
        enum: ['follow', 'like', 'comment', 'reply', 'wallet', 'bid_received', 'bid_outbid', 'bid_accepted'],
        required: true
    },
    entityId: {
        type: String, // Ad ID or Comment ID
        index: true
    },
    message: String,
    entityThumbnail: String,
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Force schema update in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Notification) {
    delete mongoose.models.Notification;
}

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
