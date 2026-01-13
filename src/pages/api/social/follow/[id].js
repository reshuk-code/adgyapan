
import dbConnect from '@/lib/db';
import Follow from '@/models/Follow';
import Notification from '@/models/Notification';
import { getAuth, createClerkClient } from '@clerk/nextjs/server';
import { pusher } from '@/lib/pusher';
import { sendNotification } from '@/lib/notifications';
import Subscription from '@/models/Subscription';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId: followerId } = getAuth(req);
    const { id: followingId } = req.query; // target user to follow

    if (!followerId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (followerId === followingId) {
        return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    await dbConnect();

    try {
        const existingFollow = await Follow.findOne({ followerId, followingId });

        if (existingFollow) {
            // UNFOLLOW
            await Follow.deleteOne({ _id: existingFollow._id });
            return res.status(200).json({ success: true, following: false });
        } else {
            // FOLLOW
            await Follow.create({ followerId, followingId });

            // Create notification for the target user
            const actor = await clerkClient.users.getUser(followerId);

            // Check Pro Status
            const actorSub = await Subscription.findOne({ userId: followerId });
            const isPro = actorSub && (actorSub.plan?.toLowerCase() === 'pro' || actorSub.plan?.toLowerCase() === 'enterprise');

            const notificationPayload = {
                actor: {
                    id: followerId,
                    name: actor.username || `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
                    avatar: actor.imageUrl
                },
                type: 'follow',
                message: 'started following you',
                actorIsPro: isPro
            };

            await sendNotification(followingId, notificationPayload);

            try {
                await pusher.trigger(`user-${followingId}`, 'notification', notificationPayload);
            } catch (err) {
                console.error('Pusher trigger failed:', err);
            }

            return res.status(200).json({ success: true, following: true });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
