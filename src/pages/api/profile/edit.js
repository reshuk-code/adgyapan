
import dbConnect from '@/lib/db';
import Profile from '@/models/Profile';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { bio, instagram, twitter, website, countBothViews } = req.body;

    console.log('Profile edit API received:', { bio, instagram, twitter, website, countBothViews }); // Debug log

    try {
        const updateData = {
            bio: bio?.substring(0, 160),
            instagram,
            twitter,
            website,
            countBothViews: countBothViews !== undefined ? countBothViews : false,
            updatedAt: Date.now()
        };

        console.log('Updating profile with:', updateData); // Debug log

        const profile = await Profile.findOneAndUpdate(
            { userId },
            updateData,
            { upsert: true, new: true, runValidators: true }
        );

        console.log('Profile saved:', profile); // Debug log

        return res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Profile save error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
