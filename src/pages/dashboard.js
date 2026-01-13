
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BarChart2, Eye, MousePointer2, Settings, Share2, Globe, FileEdit, BadgeCheck, Zap, Layers, TrendingUp, Lock, ShieldCheck, Info, Users, Download, Filter } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const { isLoaded, userId, getToken } = useAuth();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sub, setSub] = useState({ plan: 'basic', status: 'active' });
    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [selectedAdForListing, setSelectedAdForListing] = useState(null);
    const [listingFormData, setListingFormData] = useState({ basePrice: '', targetViews: 100, durationDays: 7 });
    const [myListings, setMyListings] = useState([]);
    const [bidsForMe, setBidsForMe] = useState([]);
    const [myPurchases, setMyPurchases] = useState([]);
    const [leads, setLeads] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [selectedLeadStatus, setSelectedLeadStatus] = useState('all');

    const fetchData = async () => {
        if (!isLoaded || !userId) return;
        try {
            const [adsRes, subRes, marketplaceRes, purchasesRes] = await Promise.all([
                fetch('/api/ads'),
                fetch('/api/subscriptions/me'),
                fetch('/api/marketplace/my-listings'),
                fetch('/api/marketplace/my-purchases')
            ]);
            const adsData = await adsRes.json();
            const subData = await subRes.json();
            const marketData = await marketplaceRes.json();
            const purchasesData = await purchasesRes.json();

            if (adsData.success) setAds(adsData.data);
            if (subData.success) setSub(subData.data);
            if (marketData.success) {
                setMyListings(marketData.listings);
                setBidsForMe(marketData.bids);
            }
            if (purchasesData.success) setMyPurchases(purchasesData.data);

            // Fetch leads for Pro users
            if (subData.success && (subData.data.plan === 'pro' || subData.data.plan === 'enterprise')) {
                fetchLeads();
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isLoaded, userId]);

    const fetchLeads = async () => {
        setLeadsLoading(true);
        try {
            const res = await fetch('/api/leads');
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
        } finally {
            setLeadsLoading(false);
        }
    };

    const updateLeadStatus = async (leadId, newStatus) => {
        try {
            const res = await fetch('/api/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, status: newStatus })
            });
            if (res.ok) {
                setLeads(leads.map(lead => lead._id === leadId ? { ...lead, status: newStatus } : lead));
            }
        } catch (error) {
            console.error('Failed to update lead status', error);
        }
    };

    const exportLeads = async () => {
        try {
            const res = await fetch('/api/leads/export');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads-export-${Date.now()}.csv`;
            a.click();
        } catch (error) {
            console.error('Failed to export leads', error);
            alert('Failed to export leads');
        }
    };

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

    const handleListForSale = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId: selectedAdForListing._id,
                    ...listingFormData
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Campaign listed successfully in the Marketplace!');
                setIsListingModalOpen(false);
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Failed to list campaign');
        }
    };

    const handleAcceptBid = async (bidId) => {
        if (!confirm('Are you sure you want to accept this bid? This will close the auction and release the API keys.')) return;
        try {
            const res = await fetch('/api/marketplace/bids', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bidId })
            });
            const data = await res.json();
            if (data.success) {
                alert('Sale completed! Buyer has received the API keys.');
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Failed to accept bid');
        }
    };

    const totalViews = ads.reduce((acc, ad) => acc + (ad.viewCount || 0), 0);
    const totalInteractions = ads.reduce((acc, ad) => acc + (ad.hoverCount || 0), 0);

    if (!isLoaded || loading) {
        return (
            <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>
                <div className="animate-pulse gold-text" style={{ fontWeight: 800 }}>Syncing Workspace...</div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '8rem' }}>
            {/* Premium Header Background Area */}
            <div style={{
                background: 'radial-gradient(circle at 0% 0%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)',
                paddingTop: '4rem',
                marginBottom: '4rem',
                borderBottom: '1px solid rgba(255,255,255,0.03)'
            }}>
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <h1 style={{ margin: 0, fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-2px' }}>Control Center</h1>
                                    {sub.plan === 'pro' && (
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            background: 'linear-gradient(90deg, #FFD700, #ff8c00)',
                                            color: '#000',
                                            fontSize: '0.7rem',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                                        }}>
                                            <BadgeCheck size={12} fill="black" /> Pro
                                        </div>
                                    )}
                                </div>
                                <p style={{ fontSize: '1.2rem', color: '#a1a1aa', fontWeight: 500 }}>Global monitoring & spatial analytics.</p>
                            </div>

                            <Link href="/create" className="btn btn-primary" style={{
                                gap: '0.8rem',
                                padding: '1rem 2rem',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                boxShadow: '0 10px 25px rgba(255, 215, 0, 0.2)'
                            }}>
                                <Plus size={20} strokeWidth={3} /> New Campaign
                            </Link>
                        </div>

                        {/* Performance analytics bar */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            {[
                                { label: 'Active Campaigns', val: ads.length, icon: <Layers size={16} /> },
                                { label: 'Visual Impressions', val: totalViews.toLocaleString(), icon: <Eye size={16} /> },
                                { label: 'Spatial Interaction', val: totalInteractions.toLocaleString(), icon: <MousePointer2 size={16} /> },
                                { label: 'System Health', val: '99.9%', icon: <Zap size={16} />, status: true }
                            ].map((stat, i) => (
                                <div key={i} style={{ background: '#050505', padding: '1.5rem 2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#52525b', marginBottom: '0.5rem' }}>
                                        {stat.icon}
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'monospace' }}>
                                        {stat.status ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
                                                <span style={{ color: '#10b981', fontSize: '1.1rem', letterSpacing: '1px' }}>ACTIVE</span>
                                            </div>
                                        ) : stat.val}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container">
                {ads.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            padding: '10rem 2rem',
                            textAlign: 'center',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            borderRadius: '32px',
                            background: 'rgba(255,255,255,0.01)'
                        }}
                    >
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '24px',
                            background: 'rgba(255,215,0,0.05)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem',
                            border: '1px solid rgba(255,215,0,0.1)'
                        }}>
                            <Zap size={40} color="#FFD700" style={{ opacity: 0.8 }} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-1px' }}>Forge Your First Reality</h2>
                        <p style={{ color: '#52525b', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                            Your cockpit is ready. Initialize your first spatial campaign to start capturing deep engagement data.
                        </p>
                        <Link href="/create" className="btn btn-primary" style={{ padding: '1.2rem 3rem', borderRadius: '12px' }}>
                            Begin Initialization
                        </Link>
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2.5rem' }}>
                        {ads.map((ad, index) => (
                            <motion.div
                                key={ad._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                }}
                            >
                                {/* Campaign Preview Window */}
                                <div style={{ position: 'relative', height: '200px', background: '#000' }}>
                                    <img src={ad.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />

                                    {/* Mini AR Sim */}
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            style={{
                                                width: '40%',
                                                aspectRatio: ad.overlay?.aspectRatio || 1.77,
                                                background: 'rgba(255, 215, 0, 0.15)',
                                                border: '1px solid rgba(255, 215, 0, 0.4)',
                                                boxShadow: '0 0 30px rgba(255, 215, 0, 0.1)',
                                                transform: `perspective(400px) rotateX(${ad.overlay?.rotationX || 0}deg) rotateY(${ad.overlay?.rotationY || 0}deg) scale(${ad.overlay?.scale || 1})`,
                                                backdropFilter: 'blur(2px)',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        {sub.plan === 'pro' && !myListings.find(l => l.adId._id === ad._id) && (
                                            <button
                                                onClick={() => {
                                                    setSelectedAdForListing(ad);
                                                    setIsListingModalOpen(true);
                                                }}
                                                style={{
                                                    padding: '8px', borderRadius: '10px', background: 'rgba(255,215,0,0.2)',
                                                    color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                                title="List for Sale"
                                            >
                                                <TrendingUp size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (sub.plan !== 'pro' && sub.plan !== 'enterprise') {
                                                    alert('Advanced editing is a Pro feature! 🚀');
                                                    return;
                                                }
                                                router.push(`/edit/${ad._id}`);
                                            }}
                                            style={{
                                                padding: '8px', borderRadius: '10px', background: 'rgba(0,0,0,0.6)',
                                                color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            <FileEdit size={16} />
                                            {sub.plan !== 'pro' && sub.plan !== 'enterprise' && <Lock size={10} style={{ color: '#FFD700' }} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Content Padding */}
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.25rem' }}>
                                                {ad.category || 'Universal'}
                                            </div>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{ad.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (sub.plan !== 'pro' && sub.plan !== 'enterprise') {
                                                    alert('Advanced Analytics is a Pro feature! 📊');
                                                    return;
                                                }
                                                router.push(`/campaign/${ad._id}`);
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <TrendingUp size={18} />
                                            {sub.plan !== 'pro' && sub.plan !== 'enterprise' && <Lock size={10} style={{ color: '#FFD700' }} />}
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#52525b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Impact</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{ad.viewCount || 0}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#52525b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2px' }}>Action</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{ad.hoverCount || 0}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                                        <button
                                            onClick={() => togglePublish(ad._id, ad.isPublished)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '0.8rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                background: ad.isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${ad.isPublished ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                                color: ad.isPublished ? '#10b981' : '#a1a1aa'
                                            }}
                                        >
                                            {ad.isPublished ? <Globe size={14} /> : <Zap size={14} />}
                                            {ad.isPublished ? 'Live' : 'Go Live'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (sub.plan !== 'pro' && sub.plan !== 'enterprise') {
                                                    alert('Advanced Analytics is a Pro feature! 📊');
                                                    return;
                                                }
                                                router.push(`/campaign/${ad._id}`);
                                            }}
                                            title="Deep Analytics"
                                            style={{
                                                width: '45px', height: '45px', borderRadius: '12px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#a1a1aa', cursor: 'pointer'
                                            }}
                                        >
                                            <TrendingUp size={18} />
                                        </button>
                                        <Link
                                            href={`/ad/${ad.slug}`}
                                            target="_blank"
                                            title="View Live"
                                            style={{
                                                width: '45px', height: '45px', borderRadius: '12px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.1)',
                                                color: '#FFD700'
                                            }}
                                        >
                                            <Share2 size={18} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Marketplace Management: My Acquisitions */}
                {sub.plan === 'pro' && myPurchases.length > 0 && (
                    <div style={{ marginTop: '6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                                <ShieldCheck style={{ color: '#00ff88' }} size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>My Acquisitions</h2>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Secure keys for your purchased campaigns.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                            {myPurchases.map((purchase) => (
                                <div key={purchase._id} className="glass-card" style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
                                        <div style={{ width: '100px', height: '60px', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img src={purchase.adId.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{purchase.adId.title}</h3>
                                            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Target: {purchase.targetViews}+ views | External Views: <strong style={{ color: '#00ff88' }}>{purchase.externalViews || 0}</strong></p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#00ff88', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>API Key</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, wordBreak: 'break-all' }}>{purchase.apiKey}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: '#00ff88', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Security PIN</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '4px' }}>{purchase.pin}</div>
                                            </div>
                                            <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', fontWeight: 800 }}>ACTIVE</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Integration Snippet</div>
                                            <pre style={{ margin: 0, fontSize: '0.7rem', color: '#00ff88', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                                {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed?apiKey=${purchase.apiKey}&pin=${purchase.pin}" width="100%" height="500px" allow="camera;gyroscope;accelerometer;xr-spatial-tracking;microphone"></iframe>`}
                                            </pre>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                            <Info size={14} />
                                            <span>Embed this frame in your 3rd party site to display the AR experience.</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Marketplace Management: Bids for Me */}
                {sub.plan === 'pro' && myListings.length > 0 && (
                    <div style={{ marginTop: '6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                                <BadgeCheck className="gold-text" size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>Marketplace Activity</h2>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Manage bids on your listed campaigns.</p>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem' }}>
                            {bidsForMe.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem' }}>No active bids on your listings yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {bidsForMe.map((bid) => (
                                        <div key={bid._id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{ width: '60px', height: '40px', borderRadius: '8px', overflow: 'hidden' }}>
                                                    <img src={bid.listingId.adId.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800 }}>{bid.listingId.adId.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Bid by: {bid.bidderId}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#FFD700', fontWeight: 900, textTransform: 'uppercase' }}>Offer Amount</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>Rs {bid.amount}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleAcceptBid(bid._id)}
                                                    className="premium-button"
                                                    style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                                                >
                                                    Accept Bid
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Lead Management Section (Pro Only) */}
            {(sub.plan === 'pro' || sub.plan === 'enterprise') && leads.length > 0 && (
                <div className="container" style={{ marginTop: '5rem' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        style={{ padding: '3rem', background: 'rgba(255,215,0,0.02)', border: '1px solid rgba(255,215,0,0.1)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Users size={28} className="gold-text" />
                                    Lead Management
                                </h2>
                                <p style={{ color: '#71717a', fontSize: '0.95rem' }}>
                                    {leads.length} total leads • {leads.filter(l => l.status === 'new').length} new
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <select
                                    value={selectedLeadStatus}
                                    onChange={(e) => setSelectedLeadStatus(e.target.value)}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">All Leads</option>
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="converted">Converted</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <button
                                    onClick={exportLeads}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: '#FFD700',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Download size={18} />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                <thead>
                                    <tr style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <th style={{ textAlign: 'left', padding: '1rem' }}>Campaign</th>
                                        <th style={{ textAlign: 'left', padding: '1rem' }}>Name</th>
                                        <th style={{ textAlign: 'left', padding: '1rem' }}>Contact</th>
                                        <th style={{ textAlign: 'left', padding: '1rem' }}>Source</th>
                                        <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads
                                        .filter(lead => selectedLeadStatus === 'all' || lead.status === selectedLeadStatus)
                                        .map((lead) => (
                                            <tr
                                                key={lead._id}
                                                style={{
                                                    background: 'rgba(255,255,255,0.02)'
                                                }}
                                            >
                                                <td style={{ padding: '1.25rem 1rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{lead.adId?.title || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.25rem' }}>{lead.adId?.slug}</div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{lead.leadData?.name || '-'}</div>
                                                    {lead.leadData?.company && (
                                                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>{lead.leadData.company}</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    <div style={{ fontSize: '0.85rem' }}>{lead.leadData?.email || '-'}</div>
                                                    {lead.leadData?.phone && (
                                                        <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>{lead.leadData.phone}</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem' }}>
                                                    <span style={{
                                                        padding: '0.35rem 0.75rem',
                                                        background: lead.source === 'ar_view' ? 'rgba(255,215,0,0.1)' : 'rgba(59,130,246,0.1)',
                                                        color: lead.source === 'ar_view' ? '#FFD700' : '#3b82f6',
                                                        borderRadius: '8px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {lead.source === 'ar_view' ? 'AR' : lead.source === 'feed_view' ? 'Feed' : 'Embed'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                                                    {new Date(lead.createdAt).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1.25rem 1rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                    <select
                                                        value={lead.status}
                                                        onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                                                        style={{
                                                            padding: '0.5rem 0.75rem',
                                                            background: lead.status === 'new' ? 'rgba(59,130,246,0.1)' :
                                                                lead.status === 'contacted' ? 'rgba(251,191,36,0.1)' :
                                                                    lead.status === 'converted' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                                                            color: lead.status === 'new' ? '#3b82f6' :
                                                                lead.status === 'contacted' ? '#fbbf24' :
                                                                    lead.status === 'converted' ? '#10b981' : '#6b7280',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 700,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="new">New</option>
                                                        <option value="contacted">Contacted</option>
                                                        <option value="converted">Converted</option>
                                                        <option value="archived">Archived</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* List for Sale Modal */}
            <AnimatePresence>
                {isListingModalOpen && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 5000,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', position: 'relative' }}
                        >
                            <button onClick={() => setIsListingModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>✕</button>

                            <TrendingUp className="gold-text" size={32} style={{ marginBottom: '1rem' }} />
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '0.5rem' }}>List Campaign</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                Set your price and views milestone to attract high-tier bidders.
                            </p>

                            <form onSubmit={handleListForSale} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Base Price (NPR)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="e.g. 500"
                                        value={listingFormData.basePrice}
                                        onChange={(e) => setListingFormData({ ...listingFormData, basePrice: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Listing Duration (Days)</label>
                                    <select
                                        value={listingFormData.durationDays}
                                        onChange={(e) => setListingFormData({ ...listingFormData, durationDays: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: 'white' }}
                                    >
                                        <option value="1">1 Day (Quick Sale)</option>
                                        <option value="3">3 Days</option>
                                        <option value="7">7 Days (Recommened)</option>
                                        <option value="14">14 Days</option>
                                        <option value="30">30 Days (Legacy Campaign)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Target Views Milestone</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="e.g. 100"
                                        value={listingFormData.targetViews}
                                        onChange={(e) => setListingFormData({ ...listingFormData, targetViews: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: 'white' }}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>Success is guaranteed when the campaign reaches this milestone.</p>
                                </div>
                                <button type="submit" className="premium-button" style={{ width: '100%', justifyContent: 'center', padding: '1.2rem', marginTop: '1rem' }}>
                                    Initialize Marketplace Listing
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
