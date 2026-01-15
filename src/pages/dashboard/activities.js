import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, ShoppingBag, Calculator, Clock, CheckCircle, XCircle, ExternalLink, Calendar, Eye, MousePointer, Globe, TrendingUp, Terminal, Copy, Code, Info, ChevronRight, X } from 'lucide-react';

export default function AdActivities() {
    const [activeTab, setActiveTab] = useState('bids');
    const [myBids, setMyBids] = useState([]);
    const [myAcquisitions, setMyAcquisitions] = useState([]); // Formerly purchases
    const [myListings, setMyListings] = useState([]);
    const [receivedBids, setReceivedBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of bid/listing being processed
    const [selectedSetup, setSelectedSetup] = useState(null); // item for setup guide
    const [copied, setCopied] = useState(false);

    // ROI Calculator State
    const [roiInputs, setRoiInputs] = useState({
        bidAmount: 10, // CPM
        targetViews: 10000,
        conversionRate: 2, // %
        valuePerLead: 50 // $
    });

    const calculateROI = () => {
        const cost = (roiInputs.bidAmount * roiInputs.targetViews) / 1000;
        const leads = Math.floor(roiInputs.targetViews * (roiInputs.conversionRate / 100));
        const revenue = leads * roiInputs.valuePerLead;
        const profit = revenue - cost;
        const roi = cost > 0 ? ((profit / cost) * 100).toFixed(1) : 0;
        return { cost, leads, revenue, profit, roi };
    };
    const roiStats = calculateROI();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [bidsRes, acquisitionsRes, listingsRes] = await Promise.all([
                fetch('/api/marketplace/my-bids'),
                fetch('/api/marketplace/my-purchases'),
                fetch('/api/marketplace/my-listings')
            ]);

            const bidsData = await bidsRes.json();
            const acquisitionsData = await acquisitionsRes.json();
            const listingsData = await listingsRes.json();

            if (bidsData.success) setMyBids(bidsData.data);
            if (acquisitionsData.success) setMyAcquisitions(acquisitionsData.data);
            if (listingsData.success) {
                setMyListings(listingsData.listings);
                setReceivedBids(listingsData.bids);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptBid = async (bidId) => {
        if (!confirm('Are you sure you want to accept this bid? This will sell the ad slot.')) return;
        setActionLoading(bidId);
        try {
            const res = await fetch('/api/marketplace/bids', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bidId })
            });
            const data = await res.json();
            if (data.success) {
                alert('Success! Ad slot sold.');
                fetchData();
            } else {
                alert(data.error || 'Failed to accept bid');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCloseListing = async (listingId) => {
        if (!confirm('Are you sure you want to close this listing? No further bids will be accepted.')) return;
        setActionLoading(listingId);
        try {
            const res = await fetch(`/api/marketplace/my-listings`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId })
            });
            const data = await res.json();
            if (data.success) {
                alert('Listing closed.');
                fetchData();
            } else {
                alert(data.error || 'Failed to close listing');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
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
            <Head><title>My Ad Activities | Adgyapan</title></Head>

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
                            Ad Activities
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', maxWidth: '600px' }}>
                            Track your real-time bids, manage acquired slots, and calculate campaign profitability.
                        </p>

                        {/* Modern Tabs */}
                        <div className="activities-tabs">
                            {[
                                { id: 'bids', label: 'My Bids', icon: <Gavel size={18} /> },
                                { id: 'listings', label: 'Bids Received', icon: <ShoppingBag size={18} /> },
                                { id: 'acquisitions', label: 'My Acquisitions', icon: <ExternalLink size={18} /> },
                                { id: 'roi', label: 'ROI Calculator', icon: <Calculator size={18} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '0.8rem 1.5rem',
                                        background: activeTab === tab.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                                        color: activeTab === tab.id ? '#FFD700' : 'rgba(255,255,255,0.6)',
                                        border: activeTab === tab.id ? '1px solid rgba(255, 215, 0, 0.2)' : '1px solid transparent',
                                        borderRadius: '12px',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        flexShrink: 0
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container" style={{ minHeight: '500px', paddingBottom: '6rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.5)' }}>
                        <div className="animate-pulse">Syncing Activities...</div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'bids' && (
                            <motion.div
                                key="bids"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                style={{ display: 'grid', gap: '1.5rem' }}
                            >
                                {myBids.length === 0 ? (
                                    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', borderRadius: '24px' }}>
                                        <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                            <Gavel size={32} color="#666" />
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Bids</h3>
                                        <p style={{ color: '#888', marginBottom: '2rem' }}>You haven't placed any bids yet. Explore the marketplace to find high-value ad slots.</p>
                                        <a href="/marketplace" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Go to Marketplace</a>
                                    </div>
                                ) : (
                                    myBids.map(bid => (
                                        <div key={bid._id} className="activity-card bid-card">
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
                                                <div className="bid-thumb">
                                                    {bid.listingId?.adId?.imageUrl && (
                                                        <img src={bid.listingId.adId.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                </div>
                                                <div className="bid-info">
                                                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 700, wordBreak: 'break-word' }}>{bid.listingId?.adId?.title || 'Unknown Ad'}</h3>
                                                    <div className="bid-meta">
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Clock size={14} /> {new Date(bid.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Globe size={14} /> Global Listed
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bid-card-right">
                                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', marginRight: '1rem' }}>Rs {bid.amount.toLocaleString()}</div>
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 16px', borderRadius: '20px',
                                                    fontSize: '0.8rem', fontWeight: 800,
                                                    background: bid.status === 'active' ? 'rgba(59,130,246,0.1)' :
                                                        bid.status === 'outbid' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                    color: bid.status === 'active' ? '#3b82f6' :
                                                        bid.status === 'outbid' ? '#ef4444' : '#10b981',
                                                    border: '1px solid ' + (
                                                        bid.status === 'active' ? 'rgba(59,130,246,0.2)' :
                                                            bid.status === 'outbid' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'
                                                    )
                                                }}>
                                                    {bid.status === 'active' && <Clock size={12} />}
                                                    {bid.status === 'outbid' && <XCircle size={12} />}
                                                    {bid.status === 'accepted' && <CheckCircle size={12} />}
                                                    {bid.status.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'listings' && (
                            <motion.div
                                key="listings"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                style={{ display: 'grid', gap: '2rem' }}
                            >
                                {myListings.length === 0 ? (
                                    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', borderRadius: '24px' }}>
                                        <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                            <ShoppingBag size={32} color="#666" />
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Listings Active</h3>
                                        <p style={{ color: '#888', marginBottom: '2rem' }}>You haven't listed any ad slots for sale in the marketplace yet.</p>
                                        <a href="/dashboard/inventory" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Manage Inventory</a>
                                    </div>
                                ) : (
                                    myListings.map(listing => (
                                        <div key={listing._id} className="glass-card" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                                    <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', background: '#111' }}>
                                                        {listing.adId?.imageUrl && <img src={listing.adId.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>{listing.adId?.title || 'Unknown Ad'}</h3>
                                                        <div style={{ display: 'flex', gap: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                                                            <span>Base: Rs {listing.basePrice.toLocaleString()}</span>
                                                            <span>Expires: {new Date(listing.expiryDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    {listing.status === 'open' && (
                                                        <button
                                                            disabled={actionLoading === listing._id}
                                                            onClick={() => handleCloseListing(listing._id)}
                                                            className="btn"
                                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 700 }}
                                                        >
                                                            {actionLoading === listing._id ? 'Closing...' : 'Close Listing'}
                                                        </button>
                                                    )}
                                                    <div style={{
                                                        padding: '0.6rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                                                        fontSize: '0.9rem', fontWeight: 800, color: listing.status === 'open' ? '#3b82f6' : '#10b981',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}>
                                                        Status: {listing.status.toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '1.5rem' }}>
                                                <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Active Bids</h4>
                                                <div style={{ display: 'grid', gap: '1rem' }}>
                                                    {receivedBids.filter(b => b.listingId._id === listing._id).length === 0 ? (
                                                        <div style={{ textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No bids received yet.</div>
                                                    ) : (
                                                        receivedBids.filter(b => b.listingId._id === listing._id).map(bid => (
                                                            <div key={bid._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '16px' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFD700' }}>Rs {bid.amount.toLocaleString()}</div>
                                                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>from Bidder #{bid.bidderId.slice(-6)}</div>
                                                                </div>
                                                                {listing.status === 'open' && (
                                                                    <button
                                                                        disabled={actionLoading === bid._id}
                                                                        onClick={() => handleAcceptBid(bid._id)}
                                                                        className="btn"
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                                            color: '#000', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '12px',
                                                                            fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s'
                                                                        }}
                                                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                    >
                                                                        {actionLoading === bid._id ? 'Accepting...' : 'Accept Bid'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'acquisitions' && (
                            <motion.div
                                key="acquisitions"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="activity-grid"
                            >
                                {myAcquisitions.length === 0 ? (
                                    <div className="glass-card" style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', borderRadius: '24px' }}>
                                        <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                            <ShoppingBag size={32} color="#666" />
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Acquisitions</h3>
                                        <p style={{ color: '#888' }}>You haven't acquired any ad slots yet.</p>
                                    </div>
                                ) : (
                                    myAcquisitions.map(item => (
                                        <div
                                            key={item._id}
                                            className="activity-card"
                                            style={{
                                                overflow: 'hidden',
                                                display: 'flex', flexDirection: 'column'
                                            }}
                                        >
                                            <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                    <span style={{
                                                        background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px',
                                                        borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)'
                                                    }}>ACTIVE</span>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Calendar size={14} /> Ends: {new Date(item.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Slot #{item._id.slice(-6)}</h3>
                                            </div>

                                            <div style={{ padding: '1.5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Clock size={14} /> Time Left
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFD700' }}>
                                                        {calculateDaysLeft(item.expiryDate)}
                                                    </div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <CheckCircle size={14} /> Leads
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{item.leadsCount || 0}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Gavel size={14} /> Earnings
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFD700' }}>Rs {(item.currentEarnings || 0).toLocaleString()}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Eye size={14} /> Views
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{item.externalViews || 0}</div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                                    <span>View Quota Progress</span>
                                                    <span>{Math.round(((item.externalViews || 0) / (item.targetViews || 1)) * 100)}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, ((item.externalViews || 0) / (item.targetViews || 1)) * 100)}%` }}
                                                        style={{ height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: '3px' }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>API Key</div>
                                                <code style={{
                                                    background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '12px',
                                                    fontSize: '0.9rem', color: '#10b981', display: 'block', wordBreak: 'break-all',
                                                    border: '1px dashed rgba(255,255,255,0.1)'
                                                }}>
                                                    {item.apiKey}
                                                </code>
                                            </div>

                                            <button
                                                onClick={() => setSelectedSetup(item)}
                                                className="premium-button"
                                                style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700' }}
                                            >
                                                <Terminal size={18} /> Setup Instructions
                                            </button>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'roi' && (
                            <motion.div
                                key="roi"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="glass-card"
                                style={{
                                    background: 'rgba(255,255,255,0.02)', borderRadius: '32px', padding: '3rem',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>ROI Simulator</h2>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0' }}>Project potential earnings from your ad campaigns.</p>
                                    </div>
                                    <div style={{ padding: '12px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '50%', color: '#FFD700' }}>
                                        <Calculator size={32} />
                                    </div>
                                </div>

                                <div className="roi-calculator">
                                    {/* Inputs */}
                                    <div className="roi-inputs">
                                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Campaign Parameters</h3>
                                        <div className="roi-field">
                                            <label>Bid Amount (CPM)</label>
                                            <div className="roi-input-wrapper">
                                                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Rs</span>
                                                <input
                                                    type="number"
                                                    value={roiInputs.bidAmount}
                                                    onChange={(e) => setRoiInputs({ ...roiInputs, bidAmount: parseFloat(e.target.value) || 0 })}
                                                    className="roi-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="roi-field">
                                            <label>Target Total Views</label>
                                            <div className="roi-input-wrapper">
                                                <Eye size={20} color="rgba(255,255,255,0.3)" />
                                                <input
                                                    type="number"
                                                    value={roiInputs.targetViews}
                                                    onChange={(e) => setRoiInputs({ ...roiInputs, targetViews: parseFloat(e.target.value) || 0 })}
                                                    className="roi-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="roi-field">
                                            <label>Conversion Rate (%)</label>
                                            <div className="roi-input-wrapper">
                                                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>%</span>
                                                <input
                                                    type="number"
                                                    value={roiInputs.conversionRate}
                                                    onChange={(e) => setRoiInputs({ ...roiInputs, conversionRate: parseFloat(e.target.value) || 0 })}
                                                    className="roi-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="roi-field">
                                            <label>Value Per Lead (NPR)</label>
                                            <div className="roi-input-wrapper">
                                                <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Rs</span>
                                                <input
                                                    type="number"
                                                    value={roiInputs.valuePerLead}
                                                    onChange={(e) => setRoiInputs({ ...roiInputs, valuePerLead: parseFloat(e.target.value) || 0 })}
                                                    className="roi-input"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Results */}
                                    <div className="roi-results-grid">
                                        <div className="roi-stat-card">
                                            <div className="roi-label">Estimated Cost</div>
                                            <div className="roi-value">Rs {roiStats.cost.toLocaleString()}</div>
                                        </div>
                                        <div className="roi-stat-card">
                                            <div className="roi-label">Est. Revenue</div>
                                            <div className="roi-value" style={{ color: '#10b981' }}>Rs {roiStats.revenue.toLocaleString()}</div>
                                        </div>
                                        <div className="roi-stat-card">
                                            <div className="roi-label">Total Leads</div>
                                            <div className="roi-value">{roiStats.leads.toLocaleString()}</div>
                                        </div>
                                        <div className="roi-stat-card" style={{ border: '1px solid ' + (roiStats.profit > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)') }}>
                                            <div className="roi-label">Net Profit</div>
                                            <div className="roi-value" style={{ color: roiStats.profit > 0 ? '#10b981' : '#ef4444' }}>
                                                {roiStats.profit > 0 ? '+' : ''}Rs {roiStats.profit.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="roi-total-card">
                                            <div style={{ position: 'relative', zIndex: 1 }}>
                                                <div style={{ color: '#000', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', opacity: 0.7 }}>Projected ROI</div>
                                                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#000', lineHeight: 1, letterSpacing: '-2px' }}>{roiStats.roi}%</div>
                                            </div>
                                            <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '50%', padding: '1rem' }}>
                                                <TrendingUp size={32} color="#000" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )
                }
            </div >

            {/* Setup Guide Modal */}
            < AnimatePresence >
                {selectedSetup && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative' }}>
                            <button onClick={() => { setSelectedSetup(null); setCopied(false); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '12px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '16px', color: '#FFD700' }}>
                                    <Terminal size={32} />
                                </div>
                                <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>Ad Setup <span className="gold-text">Guide</span></h2>
                            </div>

                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                You've successfully acquired this slot. Follow these steps to start syndicating and earning profit.
                            </p>

                            <div style={{ display: 'grid', gap: '2.5rem' }}>
                                {/* Step 1 */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                        <div style={{ width: '28px', height: '28px', background: '#FFD700', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>1</div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Copy Embed Code</h4>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <pre style={{
                                            background: '#000', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                                            fontSize: '0.9rem', color: '#10b981', overflowX: 'auto', margin: 0
                                        }}>
                                            {`<iframe \n  src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed?apiKey=${selectedSetup.apiKey}&pin=${selectedSetup.pin}" \n  width="100%" \n  height="600px" \n  frameborder="0"\n></iframe>`}
                                        </pre>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed?apiKey=${selectedSetup.apiKey}&pin=${selectedSetup.pin}" width="100%" height="600px" frameborder="0"></iframe>`);
                                                setCopied(true);
                                            }}
                                            style={{
                                                position: 'absolute', top: '1rem', right: '1rem',
                                                background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                                                border: 'none', color: copied ? '#000' : '#fff',
                                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                                            {copied ? 'Copied!' : 'Copy Snippet'}
                                        </button>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                        <div style={{ width: '28px', height: '28px', background: '#FFD700', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>2</div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Paste on Your Website</h4>
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                                        Open your website's HTML editor and paste the snippet where you want the ad to appear (e.g., in a sidebar or within an article).
                                    </p>
                                </div>

                                {/* Step 3 */}
                                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', color: '#10b981' }}>
                                        <Info size={20} />
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Pro Tip: Tracking & ROI</h4>
                                    </div>
                                    <p style={{ color: 'rgba(16, 185, 129, 0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                                        Every time someone views this ad on your site, we'll automatically track it and credit your wallet. You don't need to do anything else!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </>
    );
}
