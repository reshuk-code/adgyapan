
import Head from 'next/head';
import VideoFeed from '@/components/VideoFeed';
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';

export default function AdFeedView({ ads }) {
    return (
        <>
            <Head>
                <title>Adgyapan - Interactive AR Ads</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            <main style={{ backgroundColor: 'black', height: '100vh', width: '100vw', overflow: 'hidden' }}>
                <VideoFeed ads={ads} />
            </main>
        </>
    );
}

export async function getServerSideProps(context) {
    const { slug } = context.params;
    await dbConnect();

    // 1. Fetch the target ad. Try by ID first, then by slug.
    let targetAd;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        targetAd = await Ad.findById(slug).lean();
    }

    if (!targetAd) {
        targetAd = await Ad.findOne({ slug }).lean();
    }

    if (!targetAd || !targetAd.isPublished) {
        return { notFound: true };
    }

    // 2. Fetch recent ads excluding the target one
    const otherAds = await Ad.find({
        isPublished: true,
        videoUrl: { $exists: true },
        _id: { $ne: targetAd._id }
    })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    const allAds = [targetAd, ...otherAds];

    // Hydrate all users
    const allUserIds = new Set();
    allAds.forEach(ad => {
        allUserIds.add(ad.userId);
        ad.comments?.forEach(c => {
            allUserIds.add(c.userId);
            c.replies?.forEach(r => allUserIds.add(r.userId));
        });
    });

    const activeSubs = await Subscription.find({
        userId: { $in: Array.from(allUserIds) },
        status: 'active'
    });

    const planMap = {};
    activeSubs.forEach(s => { planMap[s.userId] = s.plan; });

    const serializableAds = allAds.map(ad => ({
        ...ad,
        _id: ad._id.toString(),
        createdAt: ad.createdAt.toISOString(),
        userPlan: planMap[ad.userId] || 'basic',
        authorName: ad.authorName || 'Adgyapan',
        authorAvatar: ad.authorAvatar || '',
        category: ad.category || 'other',
        likes: ad.likes || 0,
        likedBy: ad.likedBy || [],
        shares: ad.shares || 0,
        comments: (ad.comments || []).map(c => ({
            ...c,
            _id: c._id?.toString(),
            userPlan: planMap[c.userId] || 'basic',
            likedBy: c.likedBy || [],
            replies: (c.replies || []).map(r => ({
                ...r,
                _id: r._id?.toString(),
                userPlan: planMap[r.userId] || 'basic',
                createdAt: r.createdAt?.toISOString()
            })),
            createdAt: c.createdAt?.toISOString()
        }))
    }));

    return {
        props: {
            ads: serializableAds,
        },
    };
}
