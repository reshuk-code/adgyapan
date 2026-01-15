import dbConnect from '@/lib/db';
import Profile from '@/models/Profile';
import WalletTransaction from '@/models/WalletTransaction';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    if (!await isAdmin(req)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    try {
        const companyProfile = await Profile.findOne({ userId: 'ADGYAPAN_OFFICIAL' });
        const walletBalance = companyProfile?.walletBalance || 0;

        // Get recent platform fee transactions
        const recentFees = await WalletTransaction.find({
            userId: 'ADGYAPAN_OFFICIAL',
            type: 'fee'
        })
            .sort({ createdAt: -1 })
            .limit(10);

        // Calculate total revenue from fees
        const stats = await WalletTransaction.aggregate([
            { $match: { userId: 'ADGYAPAN_OFFICIAL', type: 'fee', status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                walletBalance,
                totalRevenue: stats[0]?.total || 0,
                recentFees
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
