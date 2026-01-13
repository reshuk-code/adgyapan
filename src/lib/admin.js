import { getAuth, createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function isAdmin(req) {
    const { userId } = getAuth(req);
    if (!userId) return false;

    try {
        const user = await clerkClient.users.getUser(userId);
        return user.privateMetadata?.type === 'admin';
    } catch (error) {
        console.error('Admin check failed:', error);
        return false;
    }
}
