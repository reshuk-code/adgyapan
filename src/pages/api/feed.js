
import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Profile from '@/models/Profile';
import Subscription from '@/models/Subscription';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();

    try {
        const { category } = req.query;
        const { userId } = getAuth(req);

        let interestBranches = [];
        if (userId) {
            const userProfile = await Profile.findOne({ userId });
            if (userProfile && userProfile.interestScores) {
                // Convert Map to array of branches for $switch
                // profiles.interestScores is a Map in Mongoose, so toObject() or get() might be needed if it's not a POJO.
                // Safest to access it via .get() if it's a Map, but here we can iterate.
                // actually mongoose Map becomes a POJO when using lean() or usually accessible. 
                // Let's assume it behaves like a Map or Object.

                // Mongoose Map: userProfile.get('interestScores') -> Map
                const scores = userProfile.interestScores instanceof Map
                    ? Object.fromEntries(userProfile.interestScores)
                    : userProfile.interestScores;

                if (scores) {
                    interestBranches = Object.entries(scores).map(([cat, score]) => ({
                        case: { $eq: ['$category', cat] },
                        then: score
                    }));
                }
            }
        }

        const query = { isPublished: true };
        if (category && category !== 'all') {
            query.category = category;
        }

        const ads = await Ad.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: 'userId',
                    foreignField: 'userId',
                    as: 'sub'
                }
            },
            {
                $addFields: {
                    userPlan: {
                        $let: {
                            vars: {
                                activeSub: {
                                    $filter: {
                                        input: '$sub',
                                        as: 's',
                                        cond: { $eq: ['$$s.status', 'active'] }
                                    }
                                }
                            },
                            in: {
                                $cond: {
                                    if: { $gt: [{ $size: '$$activeSub' }, 0] },
                                    then: { $arrayElemAt: ['$$activeSub.plan', 0] },
                                    else: 'basic'
                                }
                            }
                        }
                    },
                    interestScore: {
                        $let: {
                            vars: { branches: interestBranches },
                            in: {
                                $cond: {
                                    if: { $gt: [{ $size: '$$branches' }, 0] },
                                    then: { $switch: { branches: '$$branches', default: 0 } },
                                    else: 0
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    sortWeight: {
                        $add: [
                            {
                                $cond: {
                                    if: { $eq: ['$userPlan', 'pro'] },
                                    then: 10,
                                    else: 0
                                }
                            },
                            '$interestScore' // Add the interest score to the weight
                        ]
                    }
                }
            },
            {
                $sort: {
                    sortWeight: -1,
                    createdAt: -1
                }
            },
            { $limit: 25 },
            { $project: { sub: 0, sortWeight: 0, interestScore: 0 } }
        ]);

        // Hydrate all users (commenters, repliers) with their current plan
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

        const hydratedAds = ads.map(ad => ({
            ...ad,
            userPlan: planMap[ad.userId] || 'basic',
            comments: ad.comments?.map(c => ({
                ...c,
                userPlan: planMap[c.userId] || 'basic',
                replies: c.replies?.map(r => ({
                    ...r,
                    userPlan: planMap[r.userId] || 'basic'
                }))
            }))
        }));

        return res.status(200).json({ success: true, data: hydratedAds });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
