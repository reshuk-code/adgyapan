
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

        if (!ad) return res.status(404).json({ success: false, error: 'Ad not found' });

        const profile = await Profile.findOne({ userId: ad.userId });
        const countBothViews = profile?.countBothViews === true;

        if (source === 'feed' && !countBothViews) {
            return res.status(200).json({ success: true, message: 'Filtered' });
        }

        const country = req.headers['x-vercel-ip-country'] || 'Global';
        const city = req.headers['x-vercel-ip-city'] || 'Remote';

        // 0. Handle Specialized Types (Interest & ScreenTime)
        if (type === 'interest') {
            const { getAuth } = await import('@clerk/nextjs/server');
            const { userId } = getAuth(req);
            if (userId && ad.category) {
                const { action } = req.body;
                const score = action === 'stay_5s' ? 3 : (action === 'profile_visit' ? 2 : 0);
                if (score > 0) {
                    await Profile.findOneAndUpdate({ userId }, { $inc: { [`interestScores.${ad.category}`]: score } });
                }
            }
            return res.status(200).json({ success: true });
        }

        // Use UTC for all date-based tracking to avoid timezone shifts
        const now = new Date();
        const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const utcHour = now.getUTCHours();

        if (type === 'screenTime') {
            await Stat.updateOne({ adId: ad._id, date: utcToday }, { $inc: { totalScreenTime: duration || 0 } });
            return res.status(200).json({ success: true });
        }

        const globalField = type === 'view' ? 'viewCount' : (type === 'hover' ? 'hoverCount' : 'clickCount');
        const statField = type === 'view' ? 'views' : (type === 'hover' ? 'hovers' : 'clicks');

        // 1. Update Global Ad Stats
        const adInc = { [globalField]: 1 };
        if (type === 'view') {
            adInc[source === 'feed' ? 'feedViewCount' : 'arViewCount'] = 1;
        }
        await Ad.updateOne({ _id: ad._id }, { $inc: adInc });

        // 2. Find or Create Daily Stat (UTC)
        let dailyStat = await Stat.findOne({ adId: ad._id, date: utcToday });
        if (!dailyStat) {
            try {
                dailyStat = await Stat.create({
                    adId: ad._id,
                    userId: ad.userId,
                    date: utcToday,
                    hourlyEngagement: Array.from({ length: 24 }, (_, i) => ({ hour: i, views: 0, clicks: 0 })),
                    cities: [{ name: city, count: 0 }],
                    countries: [{ code: country, count: 0 }]
                });
            } catch (e) {
                // Handle possible race condition on create
                dailyStat = await Stat.findOne({ adId: ad._id, date: utcToday });
            }
        }

        if (!dailyStat) throw new Error('Failed to resolve daily stat');

        // 3. Increment Daily Stats (Basic)
        const dailyInc = { [statField]: 1 };
        if (type === 'view') {
            dailyInc[source === 'feed' ? 'feedViews' : 'arViews'] = 1;
        }
        await Stat.updateOne({ _id: dailyStat._id }, { $inc: dailyInc });

        // 4. Increment Granular Stats (Geo / Hourly)
        if (type === 'view' || type === 'click') {
            // Hourly (by UTC hour)
            await Stat.updateOne(
                { _id: dailyStat._id, 'hourlyEngagement.hour': utcHour },
                { $inc: { [`hourlyEngagement.$.${statField}`]: 1 } }
            );

            // Ensure City Exists
            await Stat.updateOne(
                { _id: dailyStat._id, 'cities.name': { $ne: city } },
                { $push: { cities: { name: city, count: 0 } } }
            );
            // Increment City
            await Stat.updateOne(
                { _id: dailyStat._id, 'cities.name': city },
                { $inc: { 'cities.$.count': 1 } }
            );

            // Ensure Country Exists
            await Stat.updateOne(
                { _id: dailyStat._id, 'countries.code': { $ne: country } },
                { $push: { countries: { code: country, count: 0 } } }
            );
            // Increment Country
            await Stat.updateOne(
                { _id: dailyStat._id, 'countries.code': country },
                { $inc: { 'countries.$.count': 1 } }
            );
        }

        // 5. Pusher Broadcast
        if (type === 'view' || type === 'click') {
            try {
                const { pusher } = await import('@/lib/pusher');
                await pusher.trigger(`ad-${ad._id}`, 'stats-update', { type, increment: 1 });
            } catch (e) { }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('[TRACK_ERROR]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
