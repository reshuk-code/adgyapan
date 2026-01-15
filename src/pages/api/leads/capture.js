import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Ad from '@/models/Ad';
import AdMarketplace from '@/models/AdMarketplace';
import Profile from '@/models/Profile';
import WalletTransaction from '@/models/WalletTransaction';
import { notifyAdmins } from '@/lib/notifications';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { adId, leadData, source = 'ar_view', apiKey, pin } = req.body;

    // Validation
    if (!leadData) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        let ad = null;
        let userId = null;

        // If adId is provided, validate it and get owner info
        if (adId) {
            ad = await Ad.findById(adId);
            if (!ad) {
                return res.status(404).json({ success: false, error: 'Campaign not found' });
            }
            userId = ad.userId;
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
            adId: adId || undefined,
            userId: userId || undefined,
            listingId: undefined, // Will fill if apiKey is valid
            leadData,
            source,
            metadata
        });

        // HANDLE BUYER EARNINGS (IF API KEY PROVIDED)
        if (apiKey && pin) {
            const listing = await AdMarketplace.findOne({ apiKey, pin, status: 'sold' }).populate('adId');
            if (listing) {
                lead.listingId = listing._id;
                await lead.save();

                // Increment counts
                listing.leadsCount += 1;

                // Calculate earnings (use ad's valuePerLead if available, default to 50 for demo)
                const commission = listing.adId?.valuePerLead || 50;
                listing.currentEarnings += commission;
                await listing.save();

                // Credit Buyer's Wallet
                const buyerProfile = await Profile.findOne({ userId: listing.winnerId });
                if (buyerProfile) {
                    buyerProfile.walletBalance += commission;
                    buyerProfile.totalEarned += commission;
                    await buyerProfile.save();

                    // Create Transaction Record
                    await WalletTransaction.create({
                        userId: listing.winnerId,
                        type: 'earnings', // We might need to add this type if it doesn't exist
                        amount: commission,
                        status: 'completed',
                        metadata: {
                            leadId: lead._id,
                            listingId: listing._id,
                            notes: `Commission for lead on "${listing.adId?.title}"`
                        }
                    });
                }
            }
        }

        // Notify Admins
        await notifyAdmins({
            title: 'New Lead Captured',
            message: `New lead from ${leadData.name || 'Anonymous'} (${source})`,
            type: 'system_alert',
            entityId: lead._id
        });

        // If it's an ad lead, update stats and send webhook
        if (ad) {
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
