
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    await dbConnect();

    if (req.method === 'GET') {
        try {
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50);
            return res.status(200).json({ success: true, data: notifications });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method === 'PUT') {
        // Mark all as read
        try {
            await Notification.updateMany({ userId, isRead: false }, { isRead: true });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
