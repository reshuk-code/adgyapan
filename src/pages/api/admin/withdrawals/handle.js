import dbConnect from '@/lib/db';
import WithdrawRequest from '@/models/WithdrawRequest';
import Profile from '@/models/Profile';
import WalletTransaction from '@/models/WalletTransaction';
import { isAdmin } from '@/lib/admin';
import { sendNotification } from '@/lib/notifications';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    await dbConnect();
    if (!await isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

    try {
        const { requestId, action, adminNote } = req.body; // action: 'approve' or 'reject'

        if (!requestId || !action) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const request = await WithdrawRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ success: false, error: 'Request already processed' });

        if (action === 'approve') {
            request.status = 'completed';
            request.adminNote = adminNote || 'Withdrawal approved and processed.';
            request.processedAt = new Date();
            await request.save();

            // Find and Update Transaction Record
            await WalletTransaction.findOneAndUpdate(
                { userId: request.userId, type: 'withdrawal', status: 'pending', amount: -request.amount },
                { status: 'completed', processedAt: new Date() }
            );

            // Send Custom Notification
            await sendNotification(request.userId, {
                actor: { name: 'Adgyapan Finance', avatar: '/logo.png', id: 'system' },
                type: 'system_alert',
                message: adminNote || `Your withdrawal of Rs ${request.amount.toLocaleString()} has been approved.`,
                actorIsPro: true
            });

        } else if (action === 'reject') {
            request.status = 'rejected';
            request.adminNote = adminNote || 'Withdrawal request rejected.';
            request.processedAt = new Date();
            await request.save();

            // REFUND the user's wallet since we deducted it on request
            const profile = await Profile.findOne({ userId: request.userId });
            if (profile) {
                profile.walletBalance += request.amount;
                await profile.save();
            }

            // Update Transaction Record
            await WalletTransaction.findOneAndUpdate(
                { userId: request.userId, type: 'withdrawal', status: 'pending', amount: -request.amount },
                { status: 'rejected', processedAt: new Date() }
            );

            // Send Custom Notification
            await sendNotification(request.userId, {
                actor: { name: 'Adgyapan Finance', avatar: '/logo.png', id: 'system' },
                type: 'system_alert',
                message: adminNote || `Your withdrawal request of Rs ${request.amount.toLocaleString()} was rejected. Funds have been returned to your wallet.`,
                actorIsPro: true
            });
        }

        return res.status(200).json({ success: true, message: `Request ${action}d successfully` });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
