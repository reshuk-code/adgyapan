
const mongoose = require('mongoose');
const { createClerkClient } = require('@clerk/nextjs/server');

// Minimal Ad model for script
const AdSchema = new mongoose.Schema({
    userId: String,
    authorName: String,
    authorAvatar: String
}, { strict: false });

const Ad = mongoose.models.Ad || mongoose.model('Ad', AdSchema);

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function sync() {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Fetching all ads...');
    const ads = await Ad.find({});
    console.log(`Found ${ads.length} ads. Syncing with Clerk...`);

    const userCache = {};

    for (const ad of ads) {
        if (!ad.userId) continue;

        try {
            if (!userCache[ad.userId]) {
                userCache[ad.userId] = await clerkClient.users.getUser(ad.userId);
            }
            const user = userCache[ad.userId];

            const realName = user.username ||
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                user.emailAddresses[0]?.emailAddress?.split('@')[0] ||
                'Creator';
            const realAvatar = user.imageUrl;

            console.log(`Updating Ad ${ad._id}: ${ad.authorName} -> ${realName}`);

            await Ad.findByIdAndUpdate(ad._id, {
                authorName: realName,
                authorAvatar: realAvatar
            });
        } catch (error) {
            console.error(`Failed to sync user ${ad.userId} for ad ${ad._id}:`, error.message);
        }
    }

    console.log('Sync complete!');
    process.exit(0);
}

sync().catch(err => {
    console.error(err);
    process.exit(1);
});
