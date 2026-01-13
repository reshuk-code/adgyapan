import dbConnect from '@/lib/db';
import WalletTransaction from '@/models/WalletTransaction';
import Profile from '@/models/Profile';
import { sendNotification } from '@/lib/notifications';
import { pusher } from '@/lib/pusher';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'PUT') return res.status(405).json({ success: false });

    await dbConnect();

    try {
        const isUserAdmin = await isAdmin(req);
        if (!isUserAdmin) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
        }

        const { id } = req.query;
        const { status } = req.body; // 'completed' or 'rejected'

        const transaction = await WalletTransaction.findById(id);
        if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

        // Normalize status to 'completed' if 'approved' was sent
        const finalStatus = (status === 'approved' || status === 'completed') ? 'completed' : status;

        transaction.status = finalStatus;
        transaction.processedAt = new Date();
        await transaction.save();

        if (finalStatus === 'completed') {
            // Atomic Increment Profile Balance
            // Using findOneAndUpdate with upsert is safer than find + new
            const updatedProfile = await Profile.findOneAndUpdate(
                { userId: transaction.userId },
                {
                    $inc: { walletBalance: Number(transaction.amount) || 0 },
                    $setOnInsert: { kycStatus: 'approved' } // Default for new users created via topup
                },
                { upsert: true, new: true }
            );

            const currentBalance = Number(updatedProfile.walletBalance) || 0;

            // Notification Payload
            const notificationPayload = {
                actor: {
                    id: 'system',
                    name: 'Adgyapan Vault',
                    avatar: '/vault-icon.png'
                },
                type: 'wallet',
                message: `Rs ${transaction.amount} Top-Up Successful! Your current balance is Rs ${currentBalance}.`,
                actorIsPro: true
            };

            // In-app & Web Push
            await sendNotification(transaction.userId, notificationPayload);

            // Real-time UI Update
            try {
                await pusher.trigger(`user-${transaction.userId}`, 'notification', notificationPayload);
            } catch (err) {
                console.error('Pusher trigger failed:', err);
            }
        }

        return res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        console.error('WALLET ADMIN GLOBAL ERROR:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
