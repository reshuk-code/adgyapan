import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    await dbConnect();

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const { adId, status, startDate, endDate, limit = 50, skip = 0 } = req.query;

            // Build query
            const query = { userId };
            if (adId) query.adId = adId;
            if (status) query.status = status;
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            // Fetch leads with pagination
            const leads = await Lead.find(query)
                .populate('adId', 'title slug category')
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
                    skip: parseInt(skip),
                    hasMore: total > parseInt(skip) + parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Fetch leads error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method === 'PUT') {
        // Update lead status or notes
        try {
            const { leadId, status, notes } = req.body;

            if (!leadId) {
                return res.status(400).json({ success: false, error: 'Lead ID is required' });
            }

            // Verify ownership
            const lead = await Lead.findOne({ _id: leadId, userId });
            if (!lead) {
                return res.status(404).json({ success: false, error: 'Lead not found or unauthorized' });
            }

            // Update fields
            const updates = {};
            if (status) updates.status = status;
            if (notes !== undefined) updates.notes = notes;
            updates.updatedAt = Date.now();

            const updatedLead = await Lead.findByIdAndUpdate(
                leadId,
                updates,
                { new: true }
            ).populate('adId', 'title slug');

            return res.status(200).json({
                success: true,
                data: updatedLead
            });
        } catch (error) {
            console.error('Update lead error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
