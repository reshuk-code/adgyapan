import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    await dbConnect();

    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { adId, status, startDate, endDate } = req.query;

        // Build query
        const query = { userId };
        if (adId) query.adId = adId;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Fetch all matching leads
        const leads = await Lead.find(query)
            .populate('adId', 'title slug')
            .sort({ createdAt: -1 });

        // Generate CSV
        const csvRows = [];

        // Header
        csvRows.push([
            'Lead ID',
            'Campaign',
            'Name',
            'Email',
            'Phone',
            'Company',
            'Message',
            'Source',
            'Status',
            'Created At',
            'Notes'
        ].join(','));

        // Data rows
        leads.forEach(lead => {
            csvRows.push([
                lead._id,
                `"${lead.adId?.title || 'N/A'}"`,
                `"${lead.leadData?.name || ''}"`,
                `"${lead.leadData?.email || ''}"`,
                `"${lead.leadData?.phone || ''}"`,
                `"${lead.leadData?.company || ''}"`,
                `"${(lead.leadData?.message || '').replace(/"/g, '""')}"`,
                lead.source,
                lead.status,
                new Date(lead.createdAt).toISOString(),
                `"${(lead.notes || '').replace(/"/g, '""')}"`
            ].join(','));
        });

        const csv = csvRows.join('\n');

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="leads-export-${Date.now()}.csv"`);

        return res.status(200).send(csv);
    } catch (error) {
        console.error('Export leads error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
