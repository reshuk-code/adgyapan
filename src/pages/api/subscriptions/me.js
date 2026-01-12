
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(200).json({ success: true, data: { plan: 'basic', status: 'active' } });
    }

    await dbConnect();

    try {
        let subscription = await Subscription.findOne({ userId });
        if (!subscription) {
            // Default for new users
            return res.status(200).json({ success: true, data: { plan: 'basic', status: 'active' } });
        }
        return res.status(200).json({ success: true, data: subscription });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
