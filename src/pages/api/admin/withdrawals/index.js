import dbConnect from '@/lib/db';
import WithdrawRequest from '@/models/WithdrawRequest';
import { isAdmin } from '@/lib/admin';
import { createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
    await dbConnect();
    if (!await isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });

    if (req.method === 'GET') {
        try {
            const requests = await WithdrawRequest.find().sort({ createdAt: -1 });

            // Hydrate with user details
            const hydrated = await Promise.all(requests.map(async (r) => {
                const user = await clerkClient.users.getUser(r.userId).catch(() => null);
                return {
                    ...r.toObject(),
                    user: user ? {
                        fullName: user.fullName || `${user.firstName} ${user.lastName}`,
                        email: user.emailAddresses[0]?.emailAddress
                    } : { fullName: 'Unknown User', email: 'N/A' }
                };
            }));

            return res.status(200).json({ success: true, data: hydrated });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
