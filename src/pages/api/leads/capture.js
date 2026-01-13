import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Ad from '@/models/Ad';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { adId, leadData, source = 'ar_view' } = req.body;

    // Validation
    if (!adId || !leadData) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        // Fetch the ad to get owner info and webhook
        const ad = await Ad.findById(adId);
        if (!ad) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        // Validate that at least one field is provided
        const hasData = Object.values(leadData).some(val => val && val.trim());
        if (!hasData) {
            return res.status(400).json({ success: false, error: 'Lead data cannot be empty' });
        }

        // Extract metadata from request
        const metadata = {
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            referrer: req.headers['referer'] || req.headers['referrer']
        };

        // Create the lead
        const lead = await Lead.create({
            adId,
            userId: ad.userId,
            leadData,
            source,
            metadata
        });

        // Increment lead count on the ad
        await Ad.findByIdAndUpdate(adId, { $inc: { leadCount: 1 } });

        // Send webhook notification if configured
        if (ad.leadWebhook) {
            try {
                await fetch(ad.leadWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'lead_captured',
                        campaignId: adId,
                        campaignTitle: ad.title,
                        lead: {
                            id: lead._id,
                            data: leadData,
                            source,
                            timestamp: lead.createdAt
                        }
                    })
                });
            } catch (webhookError) {
                console.error('Webhook delivery failed:', webhookError);
                // Don't fail the request if webhook fails
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Lead captured successfully',
            data: {
                leadId: lead._id,
                createdAt: lead.createdAt
            }
        });
    } catch (error) {
        console.error('Lead capture error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
