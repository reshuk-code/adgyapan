import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({
            success: false,
            error: 'Ad ID is required'
        });
    }

    try {
        await dbConnect();

        // Increment AR camera view count
        const ad = await Ad.findByIdAndUpdate(
            id,
            {
                $inc: {
                    arCameraViewCount: 1,
                    viewCount: 1
                }
            },
            { new: true }
        );

        if (!ad) {
            return res.status(404).json({
                success: false,
                error: 'Ad not found'
            });
        }

        res.status(200).json({
            success: true,
            arCameraViewCount: ad.arCameraViewCount,
            totalViewCount: ad.viewCount
        });
    } catch (error) {
        console.error('Error tracking AR camera view:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track view'
        });
    }
}
