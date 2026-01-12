
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { id } = req.query;
    const { status } = req.body;

    await dbConnect();

    try {
        const update = { status };
        if (status === 'active') {
            update.activatedAt = new Date();
            // Optional: set expiresAt (e.g. +30 days)
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);
            update.expiresAt = expires;
        }

        const sub = await Subscription.findByIdAndUpdate(id, update, { new: true });
        if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

        return res.status(200).json({ success: true, data: sub });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
