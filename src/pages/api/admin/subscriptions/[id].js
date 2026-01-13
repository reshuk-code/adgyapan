import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Profile from '@/models/Profile';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    if (!(await isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
    }

    const { id } = req.query;
    const { status } = req.body;

    await dbConnect();

    try {
        const update = { status };
        if (status === 'active') {
            update.activatedAt = new Date();
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);
            update.expiresAt = expires;
        }

        const sub = await Subscription.findByIdAndUpdate(id, update, { new: true });
        if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

        // AUTO-PROVISION CREDITS
        if (status === 'active' && sub.plan === 'pro') {
            await Profile.findOneAndUpdate(
                { userId: sub.userId },
                { $inc: { walletBalance: 600 } },
                { upsert: true } // Ensure profile exists to receive money
            );
        }

        return res.status(200).json({ success: true, data: sub });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
