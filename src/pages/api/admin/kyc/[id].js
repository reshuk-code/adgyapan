import dbConnect from '@/lib/db';
import MarketplaceEnrollment from '@/models/MarketplaceEnrollment';
import Profile from '@/models/Profile';
import { isAdmin } from '@/lib/admin';
import { sendNotification } from '@/lib/notifications';
import { pusher } from '@/lib/pusher';

export default async function handler(req, res) {
    if (req.method !== 'PUT') return res.status(405).json({ success: false });

    if (!(await isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.query;
    const { status, reviewNotes } = req.body;

    await dbConnect();

    try {
        const enrollment = await MarketplaceEnrollment.findById(id);
        if (!enrollment) return res.status(404).json({ success: false, error: 'Enrollment not found' });

        enrollment.status = status;
        enrollment.reviewNotes = reviewNotes;
        enrollment.reviewedAt = new Date();
        await enrollment.save();

        // Sync to Profile
        await Profile.findOneAndUpdate(
            { userId: enrollment.userId },
            { kycStatus: status }
        );

        // Notify User
        const notificationPayload = {
            actor: {
                id: 'system',
                name: 'Adgyapan Compliance',
                avatar: '/compliance-icon.png'
            },
            type: 'wallet', // Using wallet type for financial/profile updates
            message: status === 'approved'
                ? 'Your Marketplace Enrollment has been APPROVED! 🛡️ You can now bid and trade.'
                : `Your Marketplace Enrollment was rejected. Reason: ${reviewNotes || 'Information mismatch.'}`,
            actorIsPro: true
        };

        await sendNotification(enrollment.userId, notificationPayload);
        try {
            await pusher.trigger(`user-${enrollment.userId}`, 'notification', notificationPayload);
        } catch (e) {
            console.error('Pusher failed during KYC notify', e);
        }

        return res.status(200).json({ success: true, data: enrollment });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
