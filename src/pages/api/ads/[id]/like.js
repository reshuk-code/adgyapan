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
    const { id } = req.query;

    if (!userId) {
        return res.status(401).json({ error: 'Please sign in to like ads' });
    }

    await dbConnect();

    try {
        const existingAd = await Ad.findById(id);
        if (!existingAd) return res.status(404).json({ success: false, error: 'Ad not found' });

        const alreadyLiked = existingAd.likedBy && existingAd.likedBy.includes(userId);

        let ad;
        if (alreadyLiked) {
            ad = await Ad.findByIdAndUpdate(
                id,
                { $pull: { likedBy: userId }, $inc: { likes: -1 } },
                { new: true }
            );
        } else {
            ad = await Ad.findByIdAndUpdate(
                id,
                { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
                { new: true }
            );

            // NOTIFY: If user liked (not unliked) and it's not their own ad
            if (ad.userId !== userId) {
                const actor = await clerkClient.users.getUser(userId);
                const notificationPayload = {
                    actor: {
                        id: userId,
                        name: actor.username || `${actor.firstName || ''} ${actor.lastName || ''}`.trim(),
                        avatar: actor.imageUrl
                    },
                    type: 'like',
                    message: 'liked your ad',
                    entityId: ad._id
                };

                await sendNotification(ad.userId, notificationPayload);

                try {
                    await pusher.trigger(`user-${ad.userId}`, 'notification', notificationPayload);
                } catch (err) {
                    console.error('Pusher trigger failed:', err);
                }
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
