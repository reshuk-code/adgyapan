import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    await dbConnect();
    const { id, commentId } = req.query;

    try {
        const ad = await Ad.findById(id);
        if (!ad) return res.status(404).json({ success: false, error: 'Ad not found' });

        const comment = ad.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });

        const hasLiked = comment.likedBy && comment.likedBy.includes(userId);

        let update;
        if (hasLiked) {
            update = { $pull: { "comments.$.likedBy": userId }, $inc: { "comments.$.likes": -1 } };
        } else {
            update = { $addToSet: { "comments.$.likedBy": userId }, $inc: { "comments.$.likes": 1 } };
        }

        const updatedAd = await Ad.findOneAndUpdate(
            { _id: id, "comments._id": commentId },
            update,
            { new: true }
        );

        // HYDRATION: Fetch plans for all users involved
        const allUserIds = new Set([updatedAd.userId]);
        updatedAd.comments?.forEach(c => {
            allUserIds.add(c.userId);
            c.replies?.forEach(r => allUserIds.add(r.userId));
        });

        const activeSubs = await Subscription.find({
            userId: { $in: Array.from(allUserIds) },
            status: 'active'
        });

        const planMap = {};
        activeSubs.forEach(s => { planMap[s.userId] = s.plan; });

        const adObj = updatedAd.toObject();
        adObj.userPlan = planMap[updatedAd.userId] || 'basic';
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
