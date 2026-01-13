import dbConnect from '@/lib/db';
import Profile from '@/models/Profile';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // In a real app, this is where payment gateway verification (Khalti/eSewa) happens.
        // For this MVP, we simulate a successful transaction.

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $inc: { walletBalance: amount } },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            success: true,
            message: `Successfully added Rs ${amount} to your wallet.`,
            newBalance: profile.walletBalance
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
