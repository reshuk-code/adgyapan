
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { id } = req.query;

    try {
        const ad = await Ad.findByIdAndUpdate(id, { $inc: { shares: 1 } }, { new: true });
        if (!ad) return res.status(404).json({ success: false, error: 'Ad not found' });
        return res.status(200).json({ success: true, data: ad });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
