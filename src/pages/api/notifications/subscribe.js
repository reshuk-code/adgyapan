
import dbConnect from '@/lib/db';
import PushSubscription from '@/models/PushSubscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subscription } = req.body;
    if (!subscription) {
        return res.status(400).json({ error: 'Subscription is required' });
    }

    await dbConnect();

    try {
        await PushSubscription.findOneAndUpdate(
            { userId },
            { subscription },
            { upsert: true, new: true }
        );
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
