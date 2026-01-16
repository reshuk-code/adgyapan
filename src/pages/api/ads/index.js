
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';
import { getAuth, createClerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
    await dbConnect();
    const { userId } = getAuth(req);

    if (req.method === 'GET') {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const ads = await Ad.find({ userId }).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: ads });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method === 'POST') {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const {
                title, imageUrl, videoUrl, targetUrl, overlay, category,
                ctaText, ctaUrl, ctaType, ctaPositionX, ctaPositionY, ctaScale, ctaColor, ctaBorderRadius,

                ctaButtons, showCtaButtons,
                isPersistent, leadFormFields, leadWebhook
            } = req.body;

            if (!title || !imageUrl || !videoUrl || !targetUrl) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }

            // GATING: Check Subscription & Asset Limits
            const sub = await Subscription.findOne({ userId });
            const isPremium = sub && sub.status === 'active' && (sub.plan === 'pro' || sub.plan === 'enterprise');
            const plan = isPremium ? sub.plan : 'basic';

            const existingAdsCount = await Ad.countDocuments({ userId });

            if (!isPremium && existingAdsCount >= 3) {
                return res.status(403).json({
                    success: false,
                    error: 'Campaign limit reached. Basic plan is limited to 3 active campaigns. Upgrade to Pro for unlimited storytelling! 🚀'
                });
            }

            // Generate thumbnail hash for duplicate detection
            const thumbnailHash = crypto.createHash('md5').update(imageUrl).digest('hex');

            // Generate a random simple slug
            const slug = crypto.randomBytes(4).toString('hex'); // 8 chars

            const user = await clerkClient.users.getUser(userId);
            const authorName = user ? (
                user.username ||
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                user.emailAddresses[0]?.emailAddress?.split('@')[0] ||
                'Creator'
            ) : 'Anonymous';
            const authorAvatar = user ? user.imageUrl : '';

            const ad = await Ad.create({
                userId,
                title,
                category: isPremium ? category : 'other', // Gate category as Pro feature
                imageUrl,
                videoUrl,
                targetUrl,
                overlay,
                isPersistent,
                // Legacy CTA fields (for backward compatibility)
                ctaText,
                ctaUrl,
                ctaType,
                ctaPositionX,
                ctaPositionY,
                ctaScale,
                ctaColor,
                ctaBorderRadius,
                leadFormFields,
                leadWebhook,
                // New fields
                ctaButtons: ctaButtons || [],
                showCtaButtons: showCtaButtons !== undefined ? showCtaButtons : true,
                thumbnailHash,
                slug,
                authorName,
                authorAvatar,
                isPublished: false // Draft by default
            });

            return res.status(201).json({ success: true, data: ad });
        } catch (error) {
            // Handle duplicate thumbnail error
            if (error.code === 'DUPLICATE_THUMBNAIL') {
                return res.status(409).json({
                    success: false,
                    error: error.message,
                    code: 'DUPLICATE_THUMBNAIL'
                });
            }
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
