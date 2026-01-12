
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // In a real app, check for admin role here
    await dbConnect();

    try {
        const subs = await Subscription.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: subs });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
