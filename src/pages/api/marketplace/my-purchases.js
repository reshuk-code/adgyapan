import dbConnect from '@/lib/db';
import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            // Fetch ads purchased by this user
            const purchases = await AdMarketplace.find({
                winnerId: userId,
                status: 'sold'
            }).populate('adId');

            return res.status(200).json({
                success: true,
                data: purchases
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
