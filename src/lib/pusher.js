
import Pusher from 'pusher';

const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

let pusherInstance = null;

if (PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET && PUSHER_CLUSTER) {
    pusherInstance = new Pusher({
        appId: PUSHER_APP_ID,
        key: PUSHER_KEY,
        secret: PUSHER_SECRET,
        cluster: PUSHER_CLUSTER,
        useTLS: true,
    });
} else {
    console.warn('Pusher keys missing. Notifications will not be sent.');
    pusherInstance = {
        trigger: async () => {
            console.log('Mock Pusher trigger (keys missing)');
            return Promise.resolve();
        }
    };
}

export const pusher = pusherInstance;
