import Head from 'next/head';
import VideoFeed from '@/components/VideoFeed';
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';

export default function Home({ ads }) {
  return (
    <>
      <Head>
        <title>Adgyapan - Interactive AR Ads</title>
        <meta name="description" content="Scroll through the world's best AR campaigns." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <main style={{ backgroundColor: 'black', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {ads.length > 0 ? (
          <VideoFeed ads={ads} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', gap: '20px' }}>
            <h1>No Ads Published Yet 😔</h1>
            <p>Be the first to create an AR Campaign!</p>
            <a href="/dashboard" className="btn btn-primary">Create Campaign</a>
          </div>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps() {
  await dbConnect();

  // Fetch only published ads with videos
  const ads = await Ad.find({ isPublished: true, videoUrl: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  // Hydrate all users (authors, commenters, repliers) with their current plan
  const allUserIds = new Set();
  ads.forEach(ad => {
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

  const serializableAds = ads.map(ad => ({
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
