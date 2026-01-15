import dbConnect from '@/lib/db';
import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';
import Bid from '@/models/Bid';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            // Fetch my listings
            const listings = await AdMarketplace.find({ sellerId: userId })
                .populate('adId')
                .sort({ createdAt: -1 });

            // Fetch bids on my listings
            const listingIds = listings.map(l => l._id);
            const bids = await Bid.find({ listingId: { $in: listingIds }, status: 'active' })
                .populate({
                    path: 'listingId',
                    populate: { path: 'adId' }
                })
                .sort({ amount: -1 });

            return res.status(200).json({
                success: true,
                listings,
                bids
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { listingId } = req.body;
            if (!listingId) return res.status(400).json({ error: 'Missing listingId' });

            const listing = await AdMarketplace.findById(listingId);
            if (!listing) return res.status(404).json({ error: 'Listing not found' });
            if (listing.sellerId !== userId) return res.status(403).json({ error: 'Unauthorized' });

            listing.status = 'closed';
            await listing.save();

            // Notify any active bidders that listing is closed [Optional but good UX]
            // ... (could add notification loop here)

            return res.status(200).json({ success: true, message: 'Listing closed successfully' });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
