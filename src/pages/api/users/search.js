
import { createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const response = await clerkClient.users.getUserList({
            query: q,
            limit: 10
        });

        // Clerk v5+ getUserList might return { data: User[], totalCount: number }
        const users = Array.isArray(response) ? response : (response.data || []);

        const results = users.map(user => ({
            userId: user.id,
            userName: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User',
            avatar: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName
        }));

        return res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('[SearchAPI Error]:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
