import dbConnect from '@/lib/db';
import MarketplaceEnrollment from '@/models/MarketplaceEnrollment';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ success: false });

    if (!(await isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await dbConnect();

    try {
        const enrollments = await MarketplaceEnrollment.find({}).sort({ submittedAt: -1 });
        return res.status(200).json({ success: true, data: enrollments });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
