
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BarChart2, Eye, MousePointer2, Settings, Share2, Globe, FileEdit, BadgeCheck, Zap, Layers, TrendingUp, Lock, ShieldCheck, Info, Users, Download, Filter, Wallet, History, ArrowUpRight, ArrowDownLeft, X, CreditCard, Landmark } from 'lucide-react';

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
    const [walletBalance, setWalletBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawData, setWithdrawData] = useState({ amount: '', method: 'wallet', methodDetails: '' });
    const [withdrawLoading, setWithdrawLoading] = useState(false);

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

            // Fetch Wallet Data
            const kycRes = await fetch('/api/user/kyc');
            const kycData = await kycRes.json();
            if (kycData.success) {
                setWalletBalance(kycData.data.walletBalance);
            }

            const txRes = await fetch('/api/user/transactions');
            const txData = await txRes.json();
            if (txData.success) {
                setTransactions(txData.data);
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
                background: 'radial-gradient(circle at 50% -20%, rgba(255, 215, 0, 0.1) 0%, transparent 60%)',
                paddingTop: '6rem',
                marginBottom: '4rem',
            }}>
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                            <div>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: 'clamp(3rem, 6vw, 5rem)',
                                    fontWeight: 900,
                                    letterSpacing: '-2px',
                                    background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    lineHeight: 1
                                }}>
                                    Creator Studio
                                </h1>
                                <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', maxWidth: '600px' }}>
                                    Manage your AR campaigns, track real-time performance, and optimize for maximum engagement.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setIsWalletOpen(true)} className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Wallet size={18} className="gold-text" />
                                    <span style={{ fontWeight: 800 }}>Rs {walletBalance.toLocaleString()}</span>
                                </button>
                                <Link href="/settings" className="btn-glass">
                                    <Settings size={20} /> Settings
                                </Link>
                                <button onClick={() => router.push('/create')} className="premium-button">
                                    <Plus size={20} /> New Campaign
                                </button>
                            </div>
                        </div>

                        {/* Glass Stats Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '4rem'
                        }}>
                            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700' }}>
                                        <Layers size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>ACTIVE ADS</span>
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{ads.length}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                        <Eye size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>TOTAL IMPRESSIONS</span>
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{totalViews.toLocaleString()}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                        <MousePointer2 size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>INTERACTIONS</span>
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{totalInteractions.toLocaleString()}</div>
                            </div>
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
                        {ads.map((ad, index) => {
                            const listing = myListings.find(l => l.adId._id === ad._id);
                            const isSold = listing?.status === 'sold';
                            const isExpired = listing && (listing.status === 'expired' || new Date(listing.expiryDate) < new Date());

                            return (
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
                                        position: 'relative',
                                        opacity: isExpired ? 0.7 : 1,
                                        filter: isExpired ? 'grayscale(0.8)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isExpired) {
                                            e.currentTarget.style.transform = 'translateY(-10px)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)';
                                        }
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
                                        {!isExpired && (
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
                                        )}

                                        {/* Status Badges */}
                                        {isSold && (
                                            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#10b981', color: 'black', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                                                SOLD
                                            </div>
                                        )}
                                        {isExpired && (
                                            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                                                EXPIRED
                                            </div>
                                        )}

                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            {sub.plan === 'pro' && (!listing || isExpired) && (
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
                                                disabled={isSold || isExpired}
                                                onClick={() => {
                                                    if (isSold || isExpired) return;
                                                    if (sub.plan !== 'pro' && sub.plan !== 'enterprise') {
                                                        alert('Advanced editing is a Pro feature! 🚀');
                                                        return;
                                                    }
                                                    router.push(`/edit/${ad._id}`);
                                                }}
                                                style={{
                                                    padding: '8px', borderRadius: '10px',
                                                    background: isSold || isExpired ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.6)',
                                                    color: isSold || isExpired ? '#555' : '#fff',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    cursor: isSold || isExpired ? 'not-allowed' : 'pointer',
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
                                                disabled={isSold || isExpired}
                                                onClick={() => !isSold && !isExpired && togglePublish(ad._id, ad.isPublished)}
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
                                                    cursor: isSold || isExpired ? 'not-allowed' : 'pointer',
                                                    background: isSold || isExpired ? 'rgba(255,255,255,0.02)' : (ad.isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)'),
                                                    border: `1px solid ${ad.isPublished && !isSold && !isExpired ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                                    color: isSold || isExpired ? '#555' : (ad.isPublished ? '#10b981' : '#a1a1aa')
                                                }}
                                            >
                                                {ad.isPublished && !isSold && !isExpired ? <Globe size={14} /> : <Zap size={14} />}
                                                {isSold ? 'Sold' : isExpired ? 'Expired' : (ad.isPublished ? 'Live' : 'Go Live')}
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

                                        {/* Earnings / Payout Section */}
                                        {myListings.find(l => l.adId._id === ad._id)?.status === 'sold' && (
                                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>SOLD FOR</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>Rs {myListings.find(l => l.adId._id === ad._id).currentHighestBid}</div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            const listing = myListings.find(l => l.adId._id === ad._id);
                                                            try {
                                                                const res = await fetch('/api/marketplace/payout', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ listingId: listing._id })
                                                                });
                                                                const data = await res.json();
                                                                if (data.success) {
                                                                    alert('Success! Funds have been released to your wallet. 💰');
                                                                    fetchData();
                                                                } else {
                                                                    alert(data.error);
                                                                }
                                                            } catch (e) { alert('Payout failed'); }
                                                        }}
                                                        className="premium-button"
                                                        style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#10b981' }}
                                                    >
                                                        Withdraw Funds
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )
                }


            </div>

            {/* Lead Management Section (Pro Only) */}
            {
                (sub.plan === 'pro' || sub.plan === 'enterprise') && leads.length > 0 && (
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
                )
            }

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

            {/* Wallet & Statement Modal */}
            <AnimatePresence>
                {isWalletOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="glass-card">
                            <div style={{ padding: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>Wallet & Earnings</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>Track your revenue, spendings, and payouts.</p>
                                </div>
                                <button onClick={() => setIsWalletOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ padding: '2.5rem', overflowY: 'auto', flex: 1 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                                    <div style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, transparent 100%)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.2)' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFD700', marginBottom: '8px' }}>AVAILABLE BALANCE</div>
                                        <div style={{ fontSize: '3rem', fontWeight: 900 }}>Rs {walletBalance.toLocaleString()}</div>
                                        <button
                                            onClick={() => setIsWithdrawOpen(true)}
                                            className="premium-button"
                                            style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
                                        >
                                            Request Withdrawal
                                        </button>
                                    </div>
                                    <div style={{ padding: '2rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>FINANCIAL HEALTH</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total ROI</span>
                                                <span style={{ color: '#10b981', fontWeight: 800 }}>+24.5%</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Active Slots</span>
                                                <span style={{ fontWeight: 800 }}>{myPurchases.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <History size={20} className="gold-text" /> Recent Statement
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {transactions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.2)' }}>No transactions found yet.</div>
                                    ) : (
                                        transactions.map((tx) => (
                                            <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <div style={{ padding: '10px', borderRadius: '12px', background: tx.amount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                                                        {tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{tx.type.replace('_', ' ')}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(tx.createdAt).toLocaleString()} • {tx.metadata?.notes || 'System Transaction'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: tx.amount > 0 ? '#10b981' : '#fff' }}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: tx.status === 'completed' || tx.status === 'approved' ? '#10b981' : '#fbbf24' }}>
                                                        {tx.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Withdrawal Modal */}
            <AnimatePresence>
                {isWithdrawOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 7000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem' }}>Withdraw Funds</h2>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setWithdrawLoading(true);
                                    try {
                                        const res = await fetch('/api/user/withdraw', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(withdrawData)
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            alert('Request submitted! Funds are held until admin approval. ⏳');
                                            setIsWithdrawOpen(false);
                                            fetchData();
                                        } else alert(data.error);
                                    } catch (err) { alert('Failed to submit request'); }
                                    finally { setWithdrawLoading(false); }
                                }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                            >
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Amount to Withdraw (NPR)</label>
                                    <input
                                        type="number" required max={walletBalance} min={100}
                                        value={withdrawData.amount}
                                        onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Payment Method</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {['wallet', 'bank', 'khalti', 'esewa'].map(m => (
                                            <button
                                                key={m} type="button"
                                                onClick={() => setWithdrawData({ ...withdrawData, method: m })}
                                                style={{
                                                    padding: '12px', borderRadius: '12px', border: '1px solid',
                                                    borderColor: withdrawData.method === m ? '#FFD700' : 'rgba(255,255,255,0.1)',
                                                    background: withdrawData.method === m ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.2)',
                                                    color: withdrawData.method === m ? '#FFD700' : '#fff',
                                                    textTransform: 'capitalize', fontWeight: 700, cursor: 'pointer'
                                                }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Method Details</label>
                                    <textarea
                                        required placeholder="e.g. Bank Account Number, Phone Number, etc."
                                        value={withdrawData.methodDetails}
                                        onChange={(e) => setWithdrawData({ ...withdrawData, methodDetails: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: 'white', minHeight: '80px' }}
                                    />
                                </div>
                                <button type="submit" disabled={withdrawLoading} className="premium-button" style={{ width: '100%', justifyContent: 'center' }}>
                                    {withdrawLoading ? 'Submitting...' : 'Confirm Request'}
                                </button>
                                <button type="button" onClick={() => setIsWithdrawOpen(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
