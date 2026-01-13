import dbConnect from '@/lib/db';
import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';

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
        const listing = await AdMarketplace.findOneAndUpdate(
            { apiKey, pin, status: 'sold' },
            { $inc: { externalViews: 1 } },
            { new: true }
        ).populate('adId');

        if (!listing) {
            return res.status(401).json({ success: false, error: 'Invalid or unauthorized credentials' });
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
