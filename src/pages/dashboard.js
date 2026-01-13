
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Plus, BarChart2, Eye, MousePointer2, Settings, Share2, Globe, FileEdit, BadgeCheck, Zap } from 'lucide-react';

export default function Dashboard() {
    const { isLoaded, userId, getToken } = useAuth();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sub, setSub] = useState({ plan: 'basic', status: 'active' });

    useEffect(() => {
        async function fetchAds() {
            if (!isLoaded || !userId) return;
            try {
                const [adsRes, subRes] = await Promise.all([
                    fetch('/api/ads'),
                    fetch('/api/subscriptions/me')
                ]);
                const adsData = await adsRes.json();
                const subData = await subRes.json();
                if (adsData.success) setAds(adsData.data);
                if (subData.success) setSub(subData.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAds();
    }, [isLoaded, userId]);

    const togglePublish = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/ads/${id}/publish`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !currentStatus })
            });
            if (res.ok) {
                setAds(ads.map(ad => ad._id === id ? { ...ad, isPublished: !currentStatus } : ad));
            } else {
                const errData = await res.json();
                alert(`Failed to update status: ${errData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to toggle publish', error);
            alert('Error connecting to the server. Please try again.');
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>
                <div className="animate-pulse">Loading Workspace...</div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
            {/* Header / Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    marginBottom: '4rem',
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Workspace</h1>
                        {sub.plan === 'pro' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 215, 0, 0.1)', padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                                <BadgeCheck size={18} fill="#FFD700" color="black" />
                                <span className="gold-text" style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>Pro Member</span>
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: 0 }}>
                        Design and manage your next-generation AR campaigns from one central cockpit.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href="/create" className="btn btn-primary" style={{ gap: '0.5rem', background: '#fff', color: '#000', padding: '1rem 2rem' }}>
                        <Plus size={20} /> Create New
                    </Link>
                    <Link href="/analytics" className="btn btn-secondary" style={{ gap: '0.5rem', padding: '1rem 2rem' }}>
                        <BarChart2 size={20} /> Analytics
                    </Link>
                    <Link href="/settings" className="btn btn-secondary" style={{ gap: '0.5rem', padding: '1rem 2rem' }}>
                        <Settings size={20} /> Settings
                    </Link>
                </div>
            </motion.div>

            {/* Content Section */}
            {ads.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card"
                    style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}
                >
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Globe size={40} style={{ opacity: 0.3 }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>No active campaigns</h2>
                    <p style={{ marginBottom: '2.5rem' }}>Deploy your first AR experience and start capturing high-quality engagement data.</p>
                    <Link href="/create" className="btn btn-primary">Get Started</Link>
                </motion.div>
            ) : (
                <div className="grid">
                    {ads.map((ad, index) => (
                        <motion.div
                            key={ad._id}
                            className="glass-card"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.5 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}
                        >
                            {/* Card Image Wrapper */}
                            <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
                                <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                                {/* AR Preview Overlay on Thumbnail */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{
                                        width: '40%',
                                        aspectRatio: ad.overlay?.aspectRatio || 1.77,
                                        background: 'rgba(255, 215, 0, 0.15)',
                                        border: '1px solid rgba(255, 215, 0, 0.4)',
                                        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                        transform: `
                                            translate(${ad.overlay?.positionX * 50}px, ${-ad.overlay?.positionY * 50}px) 
                                            perspective(400px) 
                                            rotateX(${ad.overlay?.rotationX || 0}deg) 
                                            rotateY(${ad.overlay?.rotationY || 0}deg) 
                                            rotateZ(${ad.overlay?.rotation || 0}deg) 
                                            scale(${ad.overlay?.scale || 1})
                                        `,
                                        backdropFilter: 'blur(2px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Zap size={16} color="#FFD700" opacity={0.5} />
                                    </div>
                                </div>

                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />

                                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                    <span className={`status-badge ${ad.isPublished ? 'status-live' : 'status-draft'}`} style={{ backdropFilter: 'blur(10px)' }}>
                                        {ad.isPublished ? 'Live' : 'Draft'}
                                    </span>
                                </div>

                                <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{ad.title}</h3>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Visual Views</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{ad.viewCount}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Interactions</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{ad.hoverCount}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    <Link href={`/edit/${ad._id}`} className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                                        <FileEdit size={16} style={{ marginRight: '6px' }} /> Edit
                                    </Link>
                                    <button
                                        onClick={() => togglePublish(ad._id, ad.isPublished)}
                                        className="btn btn-secondary"
                                        style={{
                                            flex: 1,
                                            padding: '0.6rem',
                                            fontSize: '0.85rem',
                                            background: ad.isPublished ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            color: ad.isPublished ? '#f87171' : '#4ade80',
                                            borderColor: ad.isPublished ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                        }}
                                    >
                                        {ad.isPublished ? <Globe size={16} style={{ marginRight: '6px' }} /> : <Globe size={16} style={{ marginRight: '6px' }} />}
                                        {ad.isPublished ? 'Pause' : 'Go Live'}
                                    </button>
                                </div>
                                <Link href={`/campaign/${ad._id}`} style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#71717a', textDecoration: 'underline' }}>
                                    Advanced Statistics &rarr;
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
