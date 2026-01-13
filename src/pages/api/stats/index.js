
import dbConnect from '@/lib/db';
import Stat from '@/models/Stat';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = getAuth(req);
    const { adId } = req.query;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 1. Gating: Check if Pro
        const sub = await Subscription.findOne({ userId });

        // Admin Bypass
        // const isAdmin = userId === 'admin_id'; 

        const isPremium = sub && sub.status === 'active' && (sub.plan === 'pro' || sub.plan === 'enterprise');

        if (!isPremium) {
            let errorMessage = 'Advanced Analytics is a Pro feature. Upgrade to unlock deep insights! 📊';

            if (sub) {
                if (sub.status === 'pending') {
                    errorMessage = 'Your Pro subscription is currently pending verification. Please wait for admin approval! ⏳';
                } else if (sub.status === 'inactive') {
                    errorMessage = 'Your subscription is inactive. Please renew to access analytics. 💳';
                }
            }

            return res.status(403).json({
                success: false,
                error: errorMessage
            });
        }

        // 2. Fetch stats for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const query = { userId, date: { $gte: thirtyDaysAgo } };
        if (adId && adId !== 'all') {
            query.adId = adId;
        }

        const stats = await Stat.find(query).sort({ date: 1 });

        // 3. Aggregate deep analytics
        const aggregatedStats = {};
        const hourlyEngagement = Array.from({ length: 24 }, (_, i) => ({ hour: i, views: 0, clicks: 0 }));
        const countryStats = {};
        const cityStats = {};
        let totalScreenTime = 0;

        stats.forEach(s => {
            const dateStr = s.date.toISOString().split('T')[0];
            if (!aggregatedStats[dateStr]) {
                aggregatedStats[dateStr] = { date: dateStr, views: 0, feedViews: 0, arViews: 0, hovers: 0, clicks: 0 };
            }
            aggregatedStats[dateStr].views += s.views;
            aggregatedStats[dateStr].feedViews += (s.feedViews || 0);
            aggregatedStats[dateStr].arViews += (s.arViews || 0);
            aggregatedStats[dateStr].hovers += s.hovers;
            aggregatedStats[dateStr].clicks += s.clicks;

            // Deep stats
            totalScreenTime += (s.totalScreenTime || 0);

            s.hourlyEngagement?.forEach(h => {
                hourlyEngagement[h.hour].views += h.views;
                hourlyEngagement[h.hour].clicks += h.clicks;
            });

            s.countries?.forEach(c => {
                countryStats[c.code] = (countryStats[c.code] || 0) + c.count;
            });

            s.cities?.forEach(c => {
                cityStats[c.name] = (cityStats[c.name] || 0) + c.count;
            });
        });

        // 4. Fetch totals (Filtered or Global)
        const adQuery = { userId };
        if (adId && adId !== 'all') {
            adQuery._id = adId;
        }

        const summaryAds = await Ad.find(adQuery);
        // Also fetch ALL ads for the dropdown selector
        const dropdownAds = await Ad.find({ userId }).select('_id title imageUrl category').lean();

        const totalViews = summaryAds.reduce((acc, ad) => acc + (ad.viewCount || 0), 0);
        const summary = {
            totalAds: summaryAds.length, // If filtered, this is 1
            totalViews,
            totalFeedViews: summaryAds.reduce((acc, ad) => acc + (ad.feedViewCount || 0), 0),
            totalArViews: summaryAds.reduce((acc, ad) => acc + (ad.arViewCount || 0), 0),
            totalHovers: summaryAds.reduce((acc, ad) => acc + (ad.hoverCount || 0), 0),
            totalClicks: summaryAds.reduce((acc, ad) => acc + (ad.clickCount || 0), 0),
            totalLikes: summaryAds.reduce((acc, ad) => acc + (ad.likes || 0), 0),
            totalComments: summaryAds.reduce((acc, ad) => acc + (ad.comments?.length || 0), 0), // Basic count
            totalShares: summaryAds.reduce((acc, ad) => acc + (ad.shares || 0), 0),
            avgScreenTime: totalViews > 0 ? (totalScreenTime / totalViews).toFixed(1) : 0
        };

        return res.status(200).json({
            success: true,
            data: {
                daily: Object.values(aggregatedStats),
                hourly: hourlyEngagement,
                geo: {
                    countries: Object.entries(countryStats).map(([code, count]) => ({ code, count })),
                    cities: Object.entries(cityStats).map(([name, count]) => ({ name, count }))
                },
                summary,
                ads: dropdownAds
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
