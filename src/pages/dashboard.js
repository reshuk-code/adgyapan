
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Plus, BarChart2, Eye, MousePointer2, Settings, Share2, Globe, FileEdit, BadgeCheck } from 'lucide-react';

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
        <div className="container" style={{ marginTop: '3rem', paddingBottom: '5rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ margin: 0, fontSize: '3rem' }}>Dashboard</h1>
                        {sub.plan === 'pro' && sub.status === 'active' && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <BadgeCheck size={36} fill="#f59e0b" color="black" strokeWidth={1.5} />
                            </motion.div>
                        )}
                        <div style={{
                            background: sub.plan === 'pro' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                            padding: '0.4rem 1rem',
                            borderRadius: '2rem',
                            border: `1px solid ${sub.plan === 'pro' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: sub.plan === 'pro' ? '#f59e0b' : '#a1a1aa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {sub.plan} Plan {sub.status === 'pending' && <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>(Pending)</span>}
                        </div>
                    </div>
                    <p style={{ fontSize: '1.1rem' }}>Manage and scale your interactive AR experiences. {sub.plan === 'basic' && <Link href="/pricing" style={{ color: '#fe2c55', fontWeight: 600, marginLeft: '10px' }}>Upgrade to Pro &rarr;</Link>}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/settings" className="btn btn-secondary" style={{ gap: '0.5rem', padding: '0.8rem 1.8rem', color: '#a1a1aa' }}>
                        <Settings size={20} /> Settings
                    </Link>
                    {sub.plan !== 'basic' && (
                        <Link
                            href="/analytics"
                            className="btn btn-secondary"
                            style={{
                                gap: '0.5rem',
                                padding: '0.8rem 1.8rem',
                                borderColor: sub.status === 'active' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.1)',
                                color: sub.status === 'active' ? '#f59e0b' : '#71717a',
                                opacity: sub.status === 'active' ? 1 : 0.7,
                                pointerEvents: sub.status === 'active' ? 'auto' : 'none'
                            }}
                        >
                            <BarChart2 size={20} />
                            {sub.status === 'active' ? 'View Analytics' : 'Analytics (Pending)'}
                        </Link>
                    )}
                    <Link href="/create" className="btn btn-primary" style={{ gap: '0.5rem', padding: '0.8rem 1.8rem' }}>
                        <Plus size={20} /> New Campaign
                    </Link>
                </div>
            </motion.div>

            {ads.length === 0 ? (
                <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Zero Campaigns</h2>
                    <p style={{ marginBottom: '2rem' }}>Experience the power of WebAR by creating your first interactive ad campaign.</p>
                    <Link href="/create" className="btn btn-primary">Create Now</Link>
                </div>
            ) : (
                <div className="grid">
                    {ads.map((ad, index) => (
                        <motion.div
                            key={ad._id}
                            className="glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    zIndex: 1
                                }}>
                                    <span className={`status-badge ${ad.isPublished ? 'status-live' : 'status-draft'}`}>
                                        {ad.isPublished ? 'Live' : 'Draft'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>{ad.title}</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', fontSize: '0.8rem' }}>
                                            <Eye size={14} /> Views
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{ad.viewCount}</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', fontSize: '0.8rem' }}>
                                            <MousePointer2 size={14} /> Taps
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{ad.hoverCount}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Link href={`/campaign/${ad._id}`} className="btn btn-secondary" style={{ flex: 1, gap: '0.4rem', padding: '0.5rem' }}>
                                        <Settings size={14} /> Details
                                    </Link>
                                    <Link href={`/edit/${ad._id}`} className="btn btn-secondary" style={{ flex: 1, gap: '0.4rem', padding: '0.5rem' }}>
                                        <FileEdit size={14} /> Edit
                                    </Link>
                                    <button
                                        onClick={() => togglePublish(ad._id, ad.isPublished)}
                                        className="btn btn-secondary"
                                        style={{
                                            background: ad.isPublished ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            color: ad.isPublished ? '#f87171' : '#4ade80',
                                            borderColor: ad.isPublished ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                            flex: 1,
                                            gap: '0.4rem'
                                        }}
                                    >
                                        {ad.isPublished ? <Globe size={16} /> : <FileEdit size={16} />}
                                        {ad.isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
