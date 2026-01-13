import dbConnect from '@/lib/db';
import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    await dbConnect();
    const { userId } = getAuth(req);

    if (req.method === 'GET') {
        try {
            // Publicly viewable listings that are open and NOT expired
            const listings = await AdMarketplace.find({
                status: 'open',
                $or: [
                    { expiryDate: { $gt: new Date() } },
                    { expiryDate: { $exists: false } } // Handle legacy
                ]
            })
                .populate('adId')
                .sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: listings });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method === 'POST') {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            // PRO GATING
            const sub = await Subscription.findOne({ userId });
            const isPremium = sub && sub.status === 'active' && (sub.plan === 'pro' || sub.plan === 'enterprise');

            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Ad Marketplace is a Pro-exclusive feature. Upgrade to list your campaigns! 🚀'
                });
            }

            const { adId, basePrice, targetViews, durationDays } = req.body;

            if (!adId || !basePrice) {
                return res.status(400).json({ success: false, error: 'Missing adId or basePrice' });
            }

            // Check if already listed
            const existing = await AdMarketplace.findOne({ adId, status: { $ne: 'closed' } });
            if (existing) {
                return res.status(400).json({ success: false, error: 'This campaign is already active in the marketplace' });
            }

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + (parseInt(durationDays) || 7));

            const listing = await AdMarketplace.create({
                adId,
                sellerId: userId,
                basePrice,
                targetViews: targetViews || 100,
                status: 'open',
                expiryDate
            });

            return res.status(201).json({ success: true, data: listing });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
