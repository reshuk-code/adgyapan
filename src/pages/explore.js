
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Hash, Play, Eye, Flame, MapPin } from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: <Flame size={16} /> },
    { id: 'tech', label: 'Tech', icon: <Hash size={16} /> },
    { id: 'fashion', label: 'Fashion', icon: <Hash size={16} /> },
    { id: 'entertainment', label: 'Fun', icon: <Hash size={16} /> },
    { id: 'education', label: 'Study', icon: <Hash size={16} /> },
    { id: 'lifestyle', label: 'Life', icon: <Hash size={16} /> },
    { id: 'comedy', label: 'Comedy', icon: <Hash size={16} /> },
    { id: 'drama', label: 'Story', icon: <Hash size={16} /> },
];

export default function ExplorePage() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        async function fetchExplore() {
            setLoading(true);
            try {
                const res = await fetch(`/api/feed?category=${activeCategory}`);
                const data = await res.json();
                if (data.success) setAds(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchExplore();
    }, [activeCategory]);

    return (
        <div className="container" style={{ marginTop: '2rem', paddingBottom: '5rem' }}>
            <Head>
                <title>Explore - Adgyapan</title>
            </Head>

            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
                    <Compass size={36} style={{ color: '#fe2c55' }} /> Explore
                </h1>

                {/* Categories Bar */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '12px',
                                background: activeCategory === cat.id ? '#fe2c55' : 'rgba(255,255,255,0.05)',
                                color: activeCategory === cat.id ? 'white' : '#a1a1aa',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="glass-card animate-pulse" style={{ height: '280px', borderRadius: '1rem' }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    <AnimatePresence>
                        {ads.map((ad, i) => (
                            <motion.div
                                key={ad._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={`/ad/${ad.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="glass-card" style={{
                                        height: '280px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '1rem',
                                        cursor: 'pointer'
                                    }}>
                                        <img
                                            src={ad.imageUrl}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            alt={ad.title}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            padding: '1.5rem 1rem 1rem 1rem',
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.4rem'
                                        }}>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: 'white', lineClamp: 2 }}>{ad.title}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                                                <Eye size={12} /> {ad.viewCount || 0}
                                            </div>
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(254, 44, 85, 0.9)',
                                            color: 'white',
                                            fontSize: '0.6rem',
                                            fontWeight: 900,
                                            textTransform: 'uppercase'
                                        }}>
                                            {ad.category || 'other'}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!loading && ads.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem 0', color: '#52525b' }}>
                    <Compass size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No campaigns found in this category yet.</p>
                </div>
            )}
        </div>
    );
}
