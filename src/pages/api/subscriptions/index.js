
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { plan, paymentProof, amount } = req.body;
    if (!plan || !paymentProof) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    await dbConnect();

    try {
        // Find existing subscription or create new one
        const subscription = await Subscription.findOneAndUpdate(
            { userId },
            {
                plan,
                paymentProof,
                amount,
                status: 'pending',
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({ success: true, data: subscription });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
