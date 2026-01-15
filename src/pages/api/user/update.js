import { getAuth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Profile from '../../../../src/models/Profile';

export default async function handler(req, res) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        await dbConnect();
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const {
            bio,
            website,
            instagram,
            twitter,
            notifications,
            avatarUrl,
            phone,
            legalName,
            countBothViews
        } = req.body;

        const updateData = {};
        if (typeof bio !== 'undefined') updateData.bio = bio;
        if (typeof website !== 'undefined') updateData.website = website;
        if (typeof instagram !== 'undefined') updateData.instagram = instagram;
        if (typeof twitter !== 'undefined') updateData.twitter = twitter;
        if (typeof notifications !== 'undefined') updateData.notifications = notifications;
        if (typeof avatarUrl !== 'undefined') updateData.avatarUrl = avatarUrl;
        if (typeof phone !== 'undefined') updateData.phone = phone;
        if (typeof legalName !== 'undefined') updateData.legalName = legalName;
        if (typeof countBothViews !== 'undefined') updateData.countBothViews = countBothViews;

        console.log('Final Update Payload:', updateData); // Debug log

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, runValidators: true, upsert: true } // Upsert to create if missing
        );

        return res.status(200).json({ success: true, data: profile });

    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
}
