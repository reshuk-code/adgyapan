import dbConnect from '@/lib/db';
import Ad from '@/models/Ad';
import Subscription from '@/models/Subscription';
import Follow from '@/models/Follow';
import Profile from '@/models/Profile';
import { createClerkClient, getAuth } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = req.query;
    const { userId: viewerId } = getAuth(req);

    try {
        const [user, ads, sub, followersCount, followingCount, isFollowing, profileDoc] = await Promise.all([
            clerkClient.users.getUser(userId),
            Ad.find({ userId, isPublished: true }).sort({ createdAt: -1 }),
            Subscription.findOne({ userId }),
            Follow.countDocuments({ followingId: userId }),
            Follow.countDocuments({ followerId: userId }),
            viewerId ? Follow.exists({ followerId: viewerId, followingId: userId }) : Promise.resolve(false),
            Profile.findOne({ userId })
        ]);

        const plan = (sub && sub.status === 'active') ? sub.plan : 'basic';

        return res.status(200).json({
            success: true,
            data: {
                profile: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    imageUrl: user.imageUrl,
                    username: user.username,
                    plan: plan,
                    followersCount,
                    followingCount,
                    isFollowing: !!isFollowing,
                    bio: profileDoc?.bio || '',
                    instagram: profileDoc?.instagram || '',
                    twitter: profileDoc?.twitter || '',
                    website: profileDoc?.website || '',
                    countBothViews: profileDoc?.countBothViews !== undefined ? profileDoc.countBothViews : false
                },
                ads
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
