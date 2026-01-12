
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    await dbConnect();

    const { id } = req.query;
    const { isPublished } = req.body;

    console.log('DEBUG: Publish Request Received:', { id, isPublished, userId });

    try {
        const ad = await Ad.findOneAndUpdate(
            { _id: id, userId }, // Ensure user owns the ad
            { isPublished },
            { new: true }
        );

        if (!ad) {
            console.error('Publish Error: Ad not found or unauthorized', { id, userId });
            return res.status(404).json({ success: false, error: 'Ad not found or unauthorized' });
        }

        console.log('DEBUG: Update successful. Document state:', ad);
        return res.status(200).json({ success: true, data: ad });
    } catch (error) {
        console.error('Publish API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
