
import { v2 as cloudinary } from 'cloudinary';
import { getAuth } from '@clerk/nextjs/server';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default function handler(req, res) {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const timestamp = Math.round((new Date).getTime() / 1000);

    // We sign the request parameters.
    // For basic upload, we only need timestamp (and public_id, folder if specified).
    const params = {
        timestamp: timestamp,
        folder: 'adgyapan_mvp',
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

    res.status(200).json({
        timestamp,
        signature,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        folder: 'adgyapan_mvp'
    });
}
