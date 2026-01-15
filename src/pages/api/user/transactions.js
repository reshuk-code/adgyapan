import dbConnect from '@/lib/db';
import WalletTransaction from '@/models/WalletTransaction';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const transactions = await WalletTransaction.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50);
            return res.status(200).json({ success: true, data: transactions });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
