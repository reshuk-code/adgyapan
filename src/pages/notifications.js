
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, CheckCircle } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const res = await fetch('/api/notifications');
                const json = await res.json();
                if (json.success) setNotifications(json.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        }
        fetchNotifications();

        // Mark all as read when page opens
        fetch('/api/notifications', { method: 'PUT' });
    }, []);

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

                <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Notifications</h1>

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
                                    <img src={n.actorAvatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'black', borderRadius: '50%', padding: '2px' }}>
                                        {getIcon(n.type)}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                        <span style={{ fontWeight: '800' }}>{n.actorName}</span> {n.message}
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{new Date(n.createdAt).toLocaleString()}</span>
                                </div>
                                {n.type === 'follow' && (
                                    <Link href={`/profile/${n.actorId}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                                        View
                                    </Link>
                                )}
                                {n.entityId && (
                                    <Link href={`/ad/${n.entityId}/views`} style={{ width: '40px', height: '56px', borderRadius: '4px', overflow: 'hidden', background: '#222' }}>
                                        {/* Placeholder for ad thumbnail if we had it easily available */}
                                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
