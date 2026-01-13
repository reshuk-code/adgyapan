
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Eye, MapPin, ArrowUpRight, Search, Sparkles } from 'lucide-react';

export default function DiscoveryGallery() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchPublicAds() {
            try {
                const res = await fetch('/api/ads/public');
                const result = await res.json();
                if (result.success) setAds(result.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchPublicAds();
    }, []);

    const filteredAds = ads.filter(ad =>
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
            <Head>
                <title>Exhibits - AR Discovery Gallery</title>
            </Head>

            <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 215, 0, 0.1)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255, 215, 0, 0.2)', marginBottom: '1.5rem' }}>
                        <Sparkles size={16} className="gold-text" />
                        <span className="gold-text" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Live Ecosystem</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-2px' }}>Exhibits</h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Explore the next generation of interactive storytelling created by the Adgyapan community.
                    </p>

                    <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#3f3f46' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search campaigns, industries, or creators..."
                            style={{ paddingLeft: '3.5rem', height: '4rem', borderRadius: '2rem', fontSize: '1.1rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </motion.div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
                    <p style={{ fontWeight: 700, opacity: 0.5 }}>Synchronizing with AR Cloud...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
                    {filteredAds.map((ad, i) => (
                        <motion.div
                            key={ad._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link href={`/ad/${ad.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="glass-card hover-lift" style={{ overflow: 'hidden', padding: 0 }}>
                                    <div style={{ position: 'relative', aspectRatio: '16/10' }}>
                                        <img src={ad.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {ad.category}
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {ad.title} <ArrowUpRight size={18} opacity={0.3} />
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#a1a1aa', fontSize: '0.85rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Eye size={16} /> {ad.viewCount || 0} Discovery
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={16} /> Shared
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && filteredAds.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.4 }}>
                    <Compass size={48} style={{ marginBottom: '1.5rem' }} />
                    <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>No exhibits found in this quadrant.</p>
                </div>
            )}

            <style jsx>{`
                .spinner {
                    width: 2rem;
                    height: 2rem;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top: 3px solid #FFD700;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

