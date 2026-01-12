import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';

export default async function handler(req, res) {
    const { method } = req;
    const { slug } = req.query;

    await dbConnect();

    if (method === 'GET') {
        try {
            let ad;
            // Try by ID if it's a valid ObjectId hex string
            if (slug.match(/^[0-9a-fA-F]{24}$/)) {
                ad = await Ad.findById(slug);
            }

            if (!ad) {
                ad = await Ad.findOne({ slug });
            }

            if (!ad) {
                return res.status(404).json({ success: false, error: 'Ad not found' });
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

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
