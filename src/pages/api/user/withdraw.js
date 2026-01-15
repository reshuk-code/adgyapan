import dbConnect from '@/lib/db';
import WithdrawRequest from '@/models/WithdrawRequest';
import Profile from '@/models/Profile';
import WalletTransaction from '@/models/WalletTransaction';
import { getAuth } from '@clerk/nextjs/server';
import { notifyAdmins } from '@/lib/notifications';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { amount, method, methodDetails } = req.body;

        if (!amount || !method || !methodDetails) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const profile = await Profile.findOne({ userId });
        if (!profile || profile.walletBalance < amount) {
            return res.status(400).json({ success: false, error: 'Insufficient balance' });
        }

        // 1. Deduct from wallet immediately (escrow-style)
        profile.walletBalance -= amount;
        await profile.save();

        // 2. Create Transaction Record (Pending Withdrawal)
        const transaction = await WalletTransaction.create({
            userId,
            type: 'withdrawal',
            amount: -amount, // Negative to show deduction
            status: 'pending',
            metadata: {
                notes: `Withdrawal to ${method} (${methodDetails})`
            }
        });

        // 3. Create Withdraw Request
        const request = await WithdrawRequest.create({
            userId,
            amount,
            method,
            methodDetails,
            status: 'pending'
        });

        // 4. Notify Admin
        await notifyAdmins({
            title: 'New Withdrawal Request',
            message: `User ${userId} requested Rs ${amount.toLocaleString()} via ${method}`,
            type: 'system_alert',
            entityId: request._id
        });

        return res.status(200).json({
            success: true,
            message: 'Withdrawal request submitted successfully.',
            data: { requestId: request._id }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
