
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    const { method } = req;
    const { id } = req.query;
    const { userId } = getAuth(req);

    await dbConnect();

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (method === 'GET') {
        try {
            const ad = await Ad.findOne({ _id: id });
            if (!ad) {
                return res.status(404).json({ success: false, error: 'Ad not found' });
            }

            const sub = await Subscription.findOne({ userId: ad.userId });
            const plan = (sub && sub.status === 'active') ? sub.plan : 'basic';

            // Hydrate all commenters and repliers with their plans
            const allUserIds = new Set([ad.userId]);
            ad.comments.forEach(c => {
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

            return res.status(200).json({
                success: true,
                data: adObj
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (method === 'PUT') {
        try {
            const sub = await Subscription.findOne({ userId });
            const plan = (sub && sub.status === 'active') ? sub.plan : 'basic';

            const updateData = { ...req.body };
            if (plan !== 'pro') {
                delete updateData.category; // Don't allow category updates for non-pro
            }

            const updatedAd = await Ad.findOneAndUpdate(
                { _id: id, userId },
                updateData,
                { new: true, runValidators: true }
            );
            if (!updatedAd) {
                return res.status(404).json({ success: false, error: 'Ad not found or unauthorized' });
            }
            return res.status(200).json({ success: true, data: updatedAd });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (method === 'DELETE') {
        try {
            const deletedAd = await Ad.findOneAndDelete({ _id: id, userId });
            if (!deletedAd) {
                return res.status(404).json({ success: false, error: 'Ad not found' });
            }
            return res.status(200).json({ success: true, message: 'Ad deleted successfully' });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
