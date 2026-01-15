import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Clock, Eye, MousePointer, Globe, ExternalLink, Calendar } from 'lucide-react';

export default function Inventory() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            const res = await fetch('/api/marketplace/my-purchases');
            const data = await res.json();
            if (data.success) {
                setPurchases(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateDaysLeft = (expiryDate) => {
        if (!expiryDate) return 'Infinite';
        const diff = new Date(expiryDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days} Days` : 'Expired';
    };

    return (
        <>
            <Head><title>My Ad Inventory | Adgyapan</title></Head>
            <div className="container" style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 800 }}>My Ad Inventory</h1>

                {loading ? (
                    <div style={{ color: '#888' }}>Loading inventory...</div>
                ) : purchases.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                        <h3>No active ad slots purchased.</h3>
                        <p>Visit the marketplace to buy ad space.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                        {purchases.map(item => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: '#111',
                                    borderRadius: '24px',
                                    border: '1px solid #333',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid #222' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{
                                            background: '#10b981', color: 'black', padding: '4px 12px',
                                            borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700
                                        }}>active</span>
                                        <span style={{ color: '#888', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} /> Ends: {new Date(item.expiryDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Slot #{item._id.slice(-6)}</h3>
                                </div>

                                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} /> Time Left
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFD700' }}>
                                            {calculateDaysLeft(item.expiryDate)}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Eye size={14} /> Views
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                            {item.adId?.views || 0}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MousePointer size={14} /> Clicks
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                            {item.adId?.clicks || 0}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Globe size={14} /> Sites
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                            {item.adId?.referrers?.length || 0}
                                        </div>
                                    </div>
                                </div>

                                {item.adId?.referrers?.length > 0 && (
                                    <div style={{ padding: '1.5rem', borderTop: '1px solid #222' }}>
                                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#888' }}>Top Placement Sites</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {item.adId.referrers.slice(0, 3).map((ref, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                    <span style={{ color: '#ccc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <ExternalLink size={12} /> {ref.url}
                                                    </span>
                                                    <span style={{ color: '#666' }}>{ref.count} views</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
