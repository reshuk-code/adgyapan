import dbConnect from '@/lib/db';
import WalletTransaction from '@/models/WalletTransaction';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ success: false });

    if (!(await isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
    }

    await dbConnect();

    try {
        const transactions = await WalletTransaction.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
