
import webpush from 'web-push';
import PushSubscription from '@/models/PushSubscription';
import Notification from '@/models/Notification';
import Profile from '@/models/Profile';

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
        // Fetch recipient profile for preferences
        const profile = await Profile.findOne({ userId: recipientId });
        const prefs = profile?.notifications || { email: true, push: false };

        // 1. Create In-App Notification (Always, unless you want to gate this too)
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

        // 2. Send Push Notification if subscription exists AND preference is enabled
        if (prefs.push) {
            const subRecord = await PushSubscription.findOne({ userId: recipientId });
            if (subRecord && subRecord.subscription) {
                const payload = JSON.stringify({
                    title: 'Adgyapan',
                    body: `${actorIsPro ? '✅ ' : ''}${actor.name} ${message}`,
                    icon: actor.avatar || '/icon-192x192.png',
                    data: {
                        url: entityId ? (type === 'bid_received' ? '/dashboard/activities?tab=listings' : `/ad/${entityId}/views`) : `/profile/${actor.id}`
                    },
                    badge: '/favicon.ico'
                });

                await webpush.sendNotification(subRecord.subscription, payload).catch(err => console.error('Push failed', err));
            }
        }

        // 3. Send Email if preference is enabled
        if (prefs.email && profile?.email) {
            // Simplified email logic for demo - in prod use a real service
            console.log(`[EMAIL SIMULATION] Sending to ${profile.email}: ${actor.name} ${message}`);
            // if we had a transport:
            // await transporter.sendMail({ ... });
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

export async function sendMarketplaceNotification(recipientId, { actor, type, message, amount, listingTitle, entityId }) {
    const formattedAmount = amount ? `Rs ${amount.toLocaleString()}` : '';
    let fullMessage = message;

    if (type === 'bid_received') {
        fullMessage = `placed a bid of ${formattedAmount} on your listing "${listingTitle}"`;
    } else if (type === 'bid_accepted') {
        fullMessage = `accepted your bid for "${listingTitle}"! Funds are in escrow.`;
    } else if (type === 'outbid') {
        fullMessage = `outbid you on "${listingTitle}". Your funds have been refunded.`;
    }

    return sendNotification(recipientId, {
        actor,
        type,
        message: fullMessage,
        entityId,
        actorIsPro: actor.isPro || false
    });
}
// ... (existing code)

import { createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function notifyAdmins({ title, message, type, entityId }) {
    try {
        // 1. Find all admin users. 
        // Strategy: Query Clerk for users with privateMetadata.type = 'admin'
        // Note: For large scale this should be cached or stored in DB.
        const users = await clerkClient.users.getUserList({ limit: 100 });
        const admins = users.data.filter(u => u.privateMetadata?.type === 'admin');

        console.log(`Found ${admins.length} admins to notify`);

        // 2. Send notification to each admin
        for (const admin of admins) {
            await sendNotification(admin.id, {
                actor: { id: 'system', name: 'System', avatar: '/icon-192x192.png' },
                type: type || 'system_alert',
                message,
                entityId,
                actorIsPro: true
            });
        }
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
}
