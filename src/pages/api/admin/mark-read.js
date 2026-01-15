import dbConnect from '@/lib/db';
import MarketplaceEnrollment from '@/models/MarketplaceEnrollment';
import Lead from '@/models/Lead';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false });

    if (!(await isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await dbConnect();

    try {
        const { type } = req.body; // 'kyc' or 'leads'

        if (type === 'kyc') {
            await MarketplaceEnrollment.updateMany(
                { isRead: false },
                { $set: { isRead: true } }
            );
        } else if (type === 'leads') {
            await Lead.updateMany(
                { isRead: false },
                { $set: { isRead: true } }
            );
        } else {
            return res.status(400).json({ success: false, error: 'Invalid type' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
