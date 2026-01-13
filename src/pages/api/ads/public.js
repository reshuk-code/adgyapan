
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();

    try {
        // Fetch most recent active ads that are public (or just most recent for gallery demo)
        const ads = await Ad.find({})
            .sort({ createdAt: -1 })
            .limit(12)
            .select('title imageUrl category slug userId viewCount')
            .lean();

        return res.status(200).json({ success: true, data: ads });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
