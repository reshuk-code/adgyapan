import dbConnect from '@/lib/db';
import Bid from '@/models/Bid';
import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const bids = await Bid.find({ bidderId: userId })
            .populate({
                path: 'listingId',
                populate: { path: 'adId', select: 'title imageUrl' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: bids });
    } catch (error) {
        console.error('Fetch My Bids Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
