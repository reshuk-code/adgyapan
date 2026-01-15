import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';
import Profile from '@/models/Profile';
import WalletTransaction from '@/models/WalletTransaction';

export default async function handler(req, res) {
    await dbConnect();

    // Support both query params and headers for flexibility
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const pin = req.headers['x-ad-pin'] || req.query.pin;

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    if (!apiKey || !pin) {
        return res.status(400).json({ success: false, error: 'Missing API Key or PIN' });
    }

    try {
        const listing = await AdMarketplace.findOne({ apiKey, pin, status: 'sold' }).populate('adId');

        if (!listing) {
            return res.status(401).json({ success: false, error: 'Invalid or unauthorized credentials' });
        }

        // Quota Enforcement
        if (listing.externalViews >= listing.targetViews) {
            return res.status(403).json({ success: false, error: 'Ad View Quota Reached. Please extend your contract or purchase a new slot.' });
        }

        // Increment views
        listing.externalViews += 1;

        // Calculate ROI-based Earnings: (Bid Amount / Target Views) * 1.5 profit multiplier
        const totalBidAmount = listing.currentHighestBid || listing.basePrice;
        const payoutPerView = (totalBidAmount / (listing.targetViews || 1)) * 1.5;
        listing.currentEarnings += payoutPerView;

        await listing.save();

        // CREDIT BUYER'S WALLET
        const buyerProfile = await Profile.findOne({ userId: listing.winnerId });
        if (buyerProfile) {
            buyerProfile.walletBalance += payoutPerView;
            buyerProfile.totalEarned += payoutPerView;
            await buyerProfile.save();

            // Record transaction for this view (might be noisy, but user asked for detailed statements)
            // Strategy: For views, we might want to batch, but for now individual or silent increment
            // User requested: "show all incon, where the user had spended the money... from were user got that money.. and all statement info"
            // To avoid flooding, maybe record once per session or just record it.
            await WalletTransaction.create({
                userId: listing.winnerId,
                type: 'earnings',
                amount: payoutPerView,
                status: 'completed',
                metadata: {
                    listingId: listing._id,
                    notes: `Ad view revenue for "${listing.adId?.title}"`
                }
            });
        }

        const ad = listing.adId;

        // Auto-generate GIF and optimized handles if it's a Cloudinary URL
        const getTransformUrl = (url, transform) => {
            if (!url || !url.includes('cloudinary.com')) return url;
            // Insert transformation after /upload/
            return url.replace('/upload/', `/upload/${transform}/`);
        };

        const gifUrl = getTransformUrl(ad.videoUrl, 'f_gif,w_400,h_400,c_limit,e_loop');
        const optimizedVideoUrl = getTransformUrl(ad.videoUrl, 'q_auto,vc_h264,br_1m');
        const thumbnailUrl = getTransformUrl(ad.videoUrl, 'f_jpg,so_0');

        // Return structured data for the buyer's custom AR implementation or our snippet
        return res.status(200).json({
            success: true,
            data: {
                campaignId: ad._id,
                title: ad.title,
                targetUrl: ad.targetUrl,
                videoUrl: ad.videoUrl,
                gifUrl: gifUrl,
                thumbnailUrl: thumbnailUrl,
                optimizedVideoUrl: optimizedVideoUrl,
                overlay: ad.overlay,
                cta: {
                    text: ad.ctaText,
                    url: ad.ctaUrl,
                    posX: ad.ctaPositionX,
                    posY: ad.ctaPositionY,
                    scale: ad.ctaScale,
                    color: ad.ctaColor
                },
                marketplace: {
                    soldTo: listing.winnerId,
                    targetViews: listing.targetViews
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
