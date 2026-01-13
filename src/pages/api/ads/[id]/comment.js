import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';
import { getAuth, createClerkClient } from '@clerk/nextjs/server';
import { sendNotification } from '@/lib/notifications';
import { pusher } from '@/lib/pusher';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Comment text is required' });
    }

    const { id } = req.query;
    await dbConnect();

    try {
        const user = await clerkClient.users.getUser(userId);
        const comment = {
            userId,
            userName: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Anonymous',
            userAvatar: user.imageUrl,
            text,
            createdAt: new Date()
        };

        const ad = await Ad.findByIdAndUpdate(
            id,
            { $push: { comments: comment } },
            { new: true, runValidators: true }
        );

        if (!ad) {
            return res.status(404).json({ success: false, error: 'Ad not found' });
        }

        // NOTIFY: Ad owner
        if (ad.userId !== userId) {
            // Check Pro Status
            const actorSub = await Subscription.findOne({ userId });
            const isPro = actorSub && (actorSub.plan?.toLowerCase() === 'pro' || actorSub.plan?.toLowerCase() === 'enterprise');

            const notificationPayload = {
                actor: {
                    id: userId,
                    name: comment.userName,
                    avatar: comment.userAvatar
                },
                type: 'comment',
                message: `commented: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
                entityId: ad._id,
                entityThumbnail: ad.imageUrl,
                actorIsPro: isPro
            };

            await sendNotification(ad.userId, notificationPayload);

            try {
                await pusher.trigger(`user-${ad.userId}`, 'notification', notificationPayload);
            } catch (err) {
                console.error('Pusher trigger failed:', err);
            }
        }

        // HYDRATION: Fetch plans for all users involved
        const allUserIds = new Set([ad.userId]);
        ad.comments?.forEach(c => {
            allUserIds.add(c.userId);
            c.replies?.forEach(r => allUserIds.add(r.userId));
        });

        const activeSubs = await Subscription.find({
            userId: { $in: Array.from(allUserIds) },
            status: 'active'
        });

        const planMap = {};
        activeSubs.forEach(s => { planMap[s.userId] = s.plan; });

        const adObj = ad.toObject();
        adObj.userPlan = planMap[ad.userId] || 'basic';
        adObj.comments = adObj.comments.map(c => ({
            ...c,
            userPlan: planMap[c.userId] || 'basic',
            replies: c.replies?.map(r => ({
                ...r,
                userPlan: planMap[r.userId] || 'basic'
            }))
        }));

        return res.status(200).json({ success: true, data: adObj });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
