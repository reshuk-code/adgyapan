import dbConnect from '@/lib/db';
import MarketplaceEnrollment from '@/models/MarketplaceEnrollment';
import Lead from '@/models/Lead';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ success: false });

    if (!(await isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await dbConnect();

    try {
        const [pendingKyc, newLeads] = await Promise.all([
            MarketplaceEnrollment.countDocuments({ isRead: false }),
            Lead.countDocuments({ isRead: false })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                count: pendingKyc + newLeads,
                breakdown: {
                    kyc: pendingKyc,
                    leads: newLeads
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
