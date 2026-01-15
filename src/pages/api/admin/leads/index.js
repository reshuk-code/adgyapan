import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { isAdmin } from '@/lib/admin';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ success: false });

    if (!(await isAdmin(req))) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await dbConnect();

    try {
        const { source, limit = 50, skip = 0 } = req.query;
        const query = {};
        if (source) query.source = source;
        // If searching for platform leads specifically
        if (req.query.platform === 'true') {
            query.source = { $in: ['website', 'demo', 'referral', 'landing_page'] };
        }

        const leads = await Lead.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Lead.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
