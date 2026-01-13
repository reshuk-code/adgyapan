
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, BadgeCheck } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Pusher from 'pusher-js';

export default function NotificationsPage() {
    const { user } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchNotifications() {
            try {
                const res = await fetch('/api/notifications');
                const json = await res.json();
                if (json.success) setNotifications(json.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        }
        fetchNotifications();

        // Mark all as read
        fetch('/api/notifications', { method: 'PUT' });

        // Initialize Pusher
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (pusherKey) {
            const pusher = new Pusher(pusherKey, {
                cluster: pusherCluster || 'ap2',
            });

            const channel = pusher.subscribe(`user-${user.id}`);
            channel.bind('notification', (data) => {
                const newNotif = {
                    _id: Date.now().toString(),
                    actorId: data.actor.id,
                    actorName: data.actor.name,
                    actorAvatar: data.actor.avatar,
                    actorIsPro: data.actorIsPro,
                    type: data.type,
                    message: data.message,
                    entityId: data.entityId,
                    entityThumbnail: data.entityThumbnail,
                    createdAt: new Date().toISOString(),
                    isRead: false
                };
                setNotifications(prev => [newNotif, ...prev]);
            });

            return () => {
                channel.unbind_all();
                channel.unsubscribe();
            };
        }
    }, [user]);

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={18} fill="#fe2c55" color="#fe2c55" />;
            case 'comment': return <MessageCircle size={18} fill="#3b82f6" color="#3b82f6" />;
            case 'follow': return <UserPlus size={18} color="#10b981" />;
            default: return <Bell size={18} color="#a1a1aa" />;
        }
    };

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: 'white' }}>
            <Head>
                <title>Notifications | Adgyapan</title>
            </Head>

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem', maxWidth: '600px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem' }}>
                    <ArrowLeft size={18} /> Back to Feed
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>Notifications</h1>
                    {user?.publicMetadata?.plan === 'pro' && (
                        <BadgeCheck size={24} fill="#FFD700" color="white" />
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#a1a1aa' }}>
                        <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
                        {notifications.map((n, i) => (
                            <motion.div
                                key={n._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1.25rem',
                                    background: n.isRead ? 'black' : 'rgba(255,255,255,0.03)',
                                    alignItems: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <Link href={`/profile/${n.actorId}`}>
                                        <img
                                            src={n.actorAvatar ? (n.actorAvatar.includes('img.clerk.com') ? `${n.actorAvatar}?width=64` : n.actorAvatar) : '/placeholder-user.jpg'}
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"; }}
                                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', background: '#333' }}
                                        />
                                    </Link>
                                    <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'black', borderRadius: '50%', padding: '2px' }}>
                                        {getIcon(n.type)}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                                        <Link href={`/profile/${n.actorId}`} style={{ fontWeight: '800', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {n.actorName}
                                            {String(n.actorIsPro) === 'true' || n.actorIsPro === true ? (
                                                <BadgeCheck size={14} fill="#FFD700" color="white" />
                                            ) : null}
                                        </Link>
                                        <span style={{ color: '#dadada' }}>{n.message}</span>
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{new Date(n.createdAt).toLocaleString()}</span>
                                </div>

                                {/* Action Button / Thumbnail */}
                                {n.type === 'follow' ? (
                                    <Link href={`/profile/${n.actorId}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                                        View
                                    </Link>
                                ) : n.entityThumbnail ? (
                                    <Link href={`/ad/${n.entityId}/views`} style={{ width: '40px', height: '56px', borderRadius: '4px', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                                        <img
                                            src={n.entityThumbnail}
                                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'rgba(255,255,255,0.1)'; }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </Link>
                                ) : n.entityId ? (
                                    <Link href={`/ad/${n.entityId}/views`} style={{ width: '40px', height: '56px', borderRadius: '4px', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
                                    </Link>
                                ) : null}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
