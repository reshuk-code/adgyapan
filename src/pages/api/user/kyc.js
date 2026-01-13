import dbConnect from '@/lib/db';
import Profile from '@/models/Profile';
import MarketplaceEnrollment from '@/models/MarketplaceEnrollment';
import WalletTransaction from '@/models/WalletTransaction';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    try {
        await dbConnect();
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // --- OPTIMIZED ADMIN CHECK ---
        let isUserAdmin = false;
        try {
            isUserAdmin = await isAdmin(req);
        } catch (e) {
            console.error('Admin check failed:', e);
        }

        if (req.method === 'GET') {
            const enrollment = await MarketplaceEnrollment.findOne({ userId });
            let profile = await Profile.findOne({ userId });

            if (!profile) {
                profile = await Profile.create({ userId, walletBalance: 0, kycStatus: 'none' });
            }

            // --- PRO CREDIT AUTO-PROVISIONING (SAFE CHECK) ---
            const sub = await Subscription.findOne({
                userId,
                plan: { $regex: /^pro$/i },
                status: 'active'
            });

            if (sub && (profile.walletBalance === 0 || !profile.walletBalance)) {
                const hasBonus = await WalletTransaction.findOne({ userId, type: 'subscription_bonus' });
                if (!hasBonus) {
                    await Profile.findOneAndUpdate({ userId }, { $inc: { walletBalance: 600 } });
                    // Re-fetch to have the updated number for response
                    profile = await Profile.findOne({ userId });

                    await WalletTransaction.create({
                        userId,
                        type: 'subscription_bonus',
                        amount: 600,
                        status: 'completed',
                        metadata: { notes: 'Automated Provision: Rs 1999/yr Pro Benefit' }
                    });
                }
            }

            // Source of Truth Sync
            let currentStatus = profile.kycStatus || 'none';
            if (enrollment && enrollment.status !== currentStatus) {
                currentStatus = enrollment.status;
                await Profile.findOneAndUpdate({ userId }, { kycStatus: currentStatus });
            }

            return res.status(200).json({
                success: true,
                data: {
                    kycStatus: currentStatus,
                    enrollment: enrollment,
                    walletBalance: Number(profile.walletBalance) || 0,
                    isAdmin: isUserAdmin
                }
            });
        }

        if (req.method === 'POST') {
            const data = req.body;
            if (!data.legalName || !data.phone || !data.idType || !data.idNumber || !data.idImageUrl) {
                return res.status(400).json({ success: false, error: 'Mandatory fields missing' });
            }

            await MarketplaceEnrollment.findOneAndUpdate(
                { userId },
                { ...data, status: 'pending', submittedAt: new Date() },
                { upsert: true }
            );

            await Profile.findOneAndUpdate({ userId }, { kycStatus: 'pending' }, { upsert: true });

            return res.status(200).json({ success: true, message: 'Enrollment submitted.' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (globalError) {
        console.error('KYC GLOBAL ERROR:', globalError);
        return res.status(500).json({ success: false, error: globalError.message });
    }
}
