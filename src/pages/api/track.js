
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Stat from '@/models/Stat';
import Profile from '@/models/Profile';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();

    const { slug, type, duration, source = 'ar' } = req.body; // source: 'ar' or 'feed'

    console.log(`[TRACK] Request: type=${type}, slug=${slug}, source=${source}`);

    if (!slug || !['view', 'hover', 'click', 'screenTime', 'interest'].includes(type)) {
        return res.status(400).json({ success: false, error: 'Invalid data' });
    }

    try {
        const ad = await Ad.findOne({ slug });

        if (!ad) {
            console.log('[TRACK] Ad not found for slug:', slug);
            return res.status(404).json({ success: false, error: 'Ad not found' });
        }

        // Check user's analytics preference
        const profile = await Profile.findOne({ userId: ad.userId });
        const countBothViews = profile?.countBothViews === true; // Default to false (AR-only)

        console.log(`[TRACK] Ad Owner: ${ad.userId}, CountBothViews: ${countBothViews}`);

        // Skip tracking if source is 'feed' and user only wants AR views
        if (source === 'feed' && !countBothViews) {
            console.log('[TRACK] Skipped: Feed view but user wants AR-only');
            return res.status(200).json({ success: true, message: 'Tracking skipped per user preference' });
        }

        // Extract Geo data from headers (provided by Vercel/Netlify/Nginx if applicable)
        // For development, we can try to guess or use headers
        const country = req.headers['x-vercel-ip-country'] || 'Unknown';
        const city = req.headers['x-vercel-ip-city'] || 'Unknown';
        const currentHour = new Date().getHours();

        const updateQuery = {};
        const globalUpdate = {};

        if (type === 'interest') {
            const { userId } = getAuth(req);
            if (userId && ad.category) {
                const { action } = req.body;
                let score = 0;
                if (action === 'stay_5s') score = 3;
                if (action === 'profile_visit') score = 2;

                if (score > 0) {
                    await Profile.findOneAndUpdate(
                        { userId },
                        { $inc: { [`interestScores.${ad.category}`]: score } }
                    );
                }
            }
            return res.status(200).json({ success: true });
        } else if (type === 'screenTime') {
            updateQuery.$inc = { totalScreenTime: duration || 0 };
        } else {
            const globalField = type === 'view' ? 'viewCount' : (type === 'hover' ? 'hoverCount' : 'clickCount');
            const statField = type === 'view' ? 'views' : (type === 'hover' ? 'hovers' : 'clicks');

            globalUpdate.$inc = { [globalField]: 1 };
            updateQuery.$inc = { [statField]: 1 };

            // Granular View Tracking
            if (type === 'view') {
                if (source === 'feed') {
                    globalUpdate.$inc['feedViewCount'] = 1;
                    updateQuery.$inc['feedViews'] = 1;
                } else {
                    // Default to AR if source is missing or explicit 'ar'
                    globalUpdate.$inc['arViewCount'] = 1;
                    updateQuery.$inc['arViews'] = 1;
                }
            }

            // For Views and Clicks, track Hour, City, Country
            if (type === 'view' || type === 'click') {
                // Hourly
                updateQuery.$inc[`hourlyEngagement.$[h].${statField}`] = 1;
                // City
                updateQuery.$inc[`cities.$[c].count`] = 1;
                // Country
                updateQuery.$inc[`countries.$[co].count`] = 1;
            }
        }

        // 1. Update Ad Model (Global)
        if (Object.keys(globalUpdate).length > 0) {
            await Ad.updateOne({ _id: ad._id }, globalUpdate);
        }

        // 2. Update Stat Model (Daily + Granular)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const arrayFilters = [];
        if (type === 'view' || type === 'click') {
            arrayFilters.push({ 'h.hour': currentHour });
            arrayFilters.push({ 'c.name': city });
            arrayFilters.push({ 'co.code': country });
        }

        // We use two steps for arrays to handle "upserting" into sub-documents 
        // because MongoDB's positional operators with arrayFilters can't create missing elements easily.
        // For simplicity in this demo, we'll initialize the arrays on first insert.

        let dailyStat = await Stat.findOne({ adId: ad._id, date: today });

        if (!dailyStat) {
            // Initialize with arrays
            dailyStat = await Stat.create({
                adId: ad._id,
                userId: ad.userId,
                date: today,
                hourlyEngagement: Array.from({ length: 24 }, (_, i) => ({ hour: i, views: 0, clicks: 0 })),
                cities: [{ name: city, count: 0 }],
                countries: [{ code: country, count: 0 }]
            });
        }

        // Ensure city/country exist in arrays
        if (!dailyStat.cities.find(c => c.name === city)) {
            await Stat.updateOne({ _id: dailyStat._id }, { $push: { cities: { name: city, count: 0 } } });
        }
        if (!dailyStat.countries.find(c => co.code === country)) {
            await Stat.updateOne({ _id: dailyStat._id }, { $push: { countries: { code: country, count: 0 } } });
        }

        // Now run the actual increment
        await Stat.updateOne(
            { _id: dailyStat._id },
            updateQuery,
            { arrayFilters }
        );

        // Real-time Update Trigger
        if (type === 'view' || type === 'click' || type === 'hover') {
            try {
                // Fetch latest counts to broadcast (approximate is fine, or increment locally)
                // For efficiency, we just broadcast the delta or the new totals if we had them. 
                // Here we'll just signal an update so clients can increment or refetch. 
                // Better: Pass the increment type.

                // However, getting absolute "totalViews" requires a query. 
                // Let's send a "delta" event.
                const { pusher } = await import('@/lib/pusher');
                await pusher.trigger(`ad-${ad._id}`, 'stats-update', {
                    type, // 'view', 'click'
                    increment: 1
                });
            } catch (e) {
                console.error('Pusher track error', e);
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
