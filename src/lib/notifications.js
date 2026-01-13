
import webpush from 'web-push';
import PushSubscription from '@/models/PushSubscription';
import Notification from '@/models/Notification';

// These should be in env in a real app, but I'll use the generated ones for now
const VAPID_PUBLIC_KEY = "BPqD82kfQ-_rYYsUyGvM5pnDBc9EavU1ULNK49ayg3MUjUT6ggxnUEnqvgfB73uT0sXxb6YkfPhqbyjRDc6DJSQ";
const VAPID_PRIVATE_KEY = "lo_jNxEyM2qMCXFayTNF8CNhxLEQ2fUdtQwfEoqid0U";

// I'll re-run and get the full keys to be sure
webpush.setVapidDetails(
    'mailto:admin@adgyapan.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY || VAPID_PRIVATE_KEY
);

export async function sendNotification(recipientId, { actor, type, message, entityId, entityThumbnail, actorIsPro }) {
    try {
        // 1. Create In-App Notification
        console.log(`Saving notification for ${recipientId}: actorIsPro=${actorIsPro}, thumbnail=${entityThumbnail}`);
        await Notification.create({
            userId: recipientId,
            actorId: actor.id,
            actorName: actor.name,
            actorAvatar: actor.avatar,
            actorIsPro,
            type,
            message,
            entityId,
            entityThumbnail
        });

        // 2. Send Push Notification if subscription exists
        const subRecord = await PushSubscription.findOne({ userId: recipientId });
        if (subRecord && subRecord.subscription) {
            const payload = JSON.stringify({
                title: 'Adgyapan',
                body: `${actorIsPro ? '✅ ' : ''}${actor.name} ${message}`,
                icon: actor.avatar,
                data: {
                    url: entityId ? `/ad/${entityId}/views` : `/profile/${actor.id}`
                },
                badge: '/favicon.ico'
            });

            await webpush.sendNotification(subRecord.subscription, payload);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
