import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationManager() {
    const { user } = useUser();

    useEffect(() => {
        if (!user) return;

        const subscribeToPush = async () => {
            try {
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.register('/sw.js');

                    let subscription = await registration.pushManager.getSubscription();

                    if (!subscription) {
                        const response = await fetch('/api/keys/vapid-public-key');
                        const { publicKey } = await response.json();

                        const convertedVapidKey = urlBase64ToUint8Array(publicKey);

                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey
                        });
                    }

                    // Save subscription to backend
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subscription })
                    });
                }
            } catch (error) {
                console.error('Push subscription failed:', error);
            }
        };

        subscribeToPush();

        // 2. Real-time Pusher listener
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (pusherKey && pusherCluster) {
            const pusher = new Pusher(pusherKey, {
                cluster: pusherCluster,
            });

            const channel = pusher.subscribe(`user-${user.id}`);
            channel.bind('notification', (data) => {
                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } glass-card`}
                        style={{
                            maxWidth: '350px',
                            width: '100%',
                            background: 'rgba(20, 20, 20, 0.95)',
                            backdropFilter: 'blur(20px)',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            color: 'white',
                            zIndex: 9999
                        }}
                    >
                        <img
                            style={{ height: '40px', width: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            src={data.actor.avatar}
                            alt=""
                        />
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{data.actor.name}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>{data.message}</p>
                        </div>
                    </div>
                ), { duration: 4000 });
            });

            return () => {
                pusher.unsubscribe(`user-${user.id}`);
            };
        }
    }, [user]);

    return null;
}
