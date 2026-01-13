import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Eye, MousePointer2, Zap, BadgeCheck,
    Gavel, ArrowRight, ShieldCheck, Info, Sparkles,
    CircleDashed, Trophy, Target, Wallet, UserCircle,
    UserCheck, Clock, AlertCircle, Fingerprint, Lock,
    ShieldAlert, Globe, MapPin, Receipt, Camera, ChevronRight, X,
    Crown, Scale, Gem
} from 'lucide-react';
import LuxuryBackground from '@/components/LuxuryBackground';
import TiltCard from '@/components/TiltCard';

export default function Marketplace() {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // KYC & Wallet State
    const [kycData, setKycData] = useState({ status: 'loading', balance: 0 });
    const [subscription, setSubscription] = useState(null);
    const [subLoading, setSubLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [enrollmentData, setEnrollmentData] = useState({
        legalName: '',
        phone: '',
        dob: '',
        nationality: '',
        address: '',
        idType: 'NID',
        idNumber: '',
        idImageUrl: ''
    });

    useEffect(() => {
        if (userId) {
            fetchSubscription();
            fetchKycStatus();
            fetchListings();
        }
    }, [userId]);

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/subscriptions/me');
            const data = await res.json();
            if (data.success) {
                setSubscription(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch subscription', error);
        } finally {
            setSubLoading(false);
        }
    };

    const fetchKycStatus = async () => {
        try {
            const res = await fetch('/api/user/kyc');
            const data = await res.json();
            if (data.success) {
                setKycData({
                    status: data.data.kycStatus || 'none',
                    balance: data.data.walletBalance || 0,
                    enrollment: data.data.enrollment
                });
            }
        } catch (err) {
            console.error('KYC fetch failed', err);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Get signature
            const signRes = await fetch('/api/sign-cloudinary');
            const signData = await signRes.json();

            // 2. Prepare upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', signData.api_key);
            formData.append('timestamp', signData.timestamp);
            formData.append('signature', signData.signature);
            formData.append('folder', signData.folder);

            // 3. Upload to Cloudinary
            const cloudName = signData.cloud_name;
            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (uploadData.secure_url) {
                setEnrollmentData({ ...enrollmentData, idImageUrl: uploadData.secure_url });
            } else {
                setError('Upload failed. Please try again.');
            }
        } catch (err) {
            setError('Connection error during upload.');
        } finally {
            setUploading(false);
        }
    };

    const handleKycSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/kyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrollmentData)
            });
            const data = await res.json();
            if (data.success) {
                setKycData(prev => ({ ...prev, status: 'pending' }));
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchListings = async () => {
        try {
            const res = await fetch('/api/marketplace');
            const data = await res.json();
            if (data.success) setListings(data.data);
        } catch (err) {
            console.error('Failed to fetch listings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBid = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!bidAmount) return;

        if (selectedListing.sellerId === userId) {
            setError('Operational Restriction: Assets you own cannot be targeted for escrow bids.');
            return;
        }

        if (parseFloat(bidAmount) > kycData.balance) {
            setError('Insufficient wallet balance. Please top up your credits.');
            return;
        }

        try {
            const res = await fetch('/api/marketplace/bids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId: selectedListing._id,
                    amount: parseFloat(bidAmount)
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Your bid has been placed. Funds are held in escrow.');
                setBidAmount('');
                fetchListings();
                fetchKycStatus(); // Refresh balance
                const updatedListing = { ...selectedListing, currentHighestBid: parseFloat(bidAmount) };
                setSelectedListing(updatedListing);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Connection failure. Please retry.');
        }
    };

    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');

    const handleTopUp = (e) => {
        e.preventDefault();
        if (!topUpAmount || isNaN(topUpAmount) || parseFloat(topUpAmount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        router.push(`/checkout?type=wallet&amount=${topUpAmount}`);
    };

    if (!isLoaded || loading || kycData.status === 'loading') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ color: '#FFD700' }}
                >
                    <CircleDashed size={40} strokeWidth={1} />
                </motion.div>
            </div>
        );
    }

    // --- PRO-ONLY GATE ---
    if (!subLoading && subscription && subscription.plan !== 'pro' && subscription.plan !== 'enterprise') {
        return (
            <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <LuxuryBackground />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        maxWidth: '600px',
                        width: '100%',
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(20px)',
                        padding: '4rem 3rem',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,215,0,0.2)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}
                >
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(255,215,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        border: '2px solid rgba(255,215,0,0.3)'
                    }}>
                        <Crown size={50} color="#FFD700" />
                    </div>

                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        marginBottom: '1rem',
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px'
                    }}>
                        Marketplace is for Pro Users
                    </h1>

                    <p style={{
                        fontSize: '1.1rem',
                        color: '#a1a1aa',
                        marginBottom: '3rem',
                        lineHeight: 1.6
                    }}>
                        The Royal Exchange is an exclusive marketplace for buying and selling premium AR campaigns. Upgrade to Pro to access this feature.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            'Buy & Sell AR Campaigns',
                            'KYC-Verified Transactions',
                            'Secure Wallet System',
                            'Exclusive Asset Marketplace'
                        ].map((feature, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                                <BadgeCheck size={20} color="#10b981" />
                                <span style={{ fontSize: '0.95rem', color: '#d4d4d8' }}>{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => router.push('/pricing')}
                        style={{
                            width: '100%',
                            padding: '1.25rem 2rem',
                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(255,215,0,0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        Upgrade to Pro →
                    </button>
                </motion.div>
            </div>
        );
    }

    // --- ENROLLMENT GATE ---
    if (kycData.status !== 'approved') {
        return (
            <div style={{
                background: '#050505',
                minHeight: '100vh',
                color: '#fff',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: "'Space Grotesk', sans-serif"
            }}>
                <Head>
                    <title>Identity Protocol | Adgyapan</title>
                    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
                </Head>

                <LuxuryBackground />

                {/* Material Texture Overlay */}
                <svg style={{ position: 'fixed', pointerEvents: 'none', opacity: 0.15 }}>
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                </svg>



                {/* Background Aesthetics */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100vh', background: 'radial-gradient(circle at 50% -20%, rgba(255, 215, 0, 0.08), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")', opacity: 0.03, pointerEvents: 'none' }} />

                <div className="container" style={{ paddingTop: '5vh', paddingBottom: '5vh', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center', zIndex: 1, position: 'relative' }}>

                    {/* Brand Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center', marginBottom: '3rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', marginBottom: '1rem' }}>
                            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #FFD700)' }} />
                            <Fingerprint size={32} strokeWidth={1.5} className="gold-text" />
                            <div style={{ width: '40px', height: '1px', background: 'linear-gradient(270deg, transparent, #FFD700)' }} />
                        </div>
                        <h1 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '8px', opacity: 0.5, margin: 0 }}>Identity Security Protocol</h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            maxWidth: '750px',
                            width: '100%',
                            background: 'rgba(15, 15, 15, 0.8)',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,215,0,0.15)',
                            boxShadow: '0 40px 120px rgba(0,0,0,1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {kycData.status === 'none' || kycData.status === 'rejected' ? (
                            <div style={{ padding: '0' }}>
                                {/* Wizard Progress Bar */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: '2px', background: 'rgba(255,255,255,0.05)' }}>
                                    {[1, 2, 3, 4].map(s => (
                                        <div key={s} style={{
                                            background: s <= step ? '#FFD700' : 'transparent',
                                            transition: 'background 0.5s ease',
                                            boxShadow: s === step ? '0 0 10px #FFD700' : 'none'
                                        }} />
                                    ))}
                                </div>

                                <div style={{ padding: '4rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                                        <div>
                                            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-1.5px' }}>
                                                {step === 1 && "Core Identity"}
                                                {step === 2 && "Demographics"}
                                                {step === 3 && "Verification"}
                                                {step === 4 && "Final Seal"}
                                            </h2>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                                                {step === 1 && "Start your enrollment with primary contact details."}
                                                {step === 2 && "Input your legal origin and residential residence."}
                                                {step === 3 && "Attach your government-sanctioned identification."}
                                                {step === 4 && "Complete biometric matching for full access."}
                                            </p>
                                        </div>
                                        <div style={{ background: 'rgba(255,215,0,0.05)', color: '#FFD700', padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, border: '1px solid rgba(255,215,0,0.1)' }}>
                                            STAGE 0{step}
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div key="st1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    <div className="cyber-field">
                                                        <label><UserCircle size={14} /> Official Full Name</label>
                                                        <input
                                                            type="text" required placeholder="Legal Name as per ID"
                                                            value={enrollmentData.legalName}
                                                            onChange={e => setEnrollmentData({ ...enrollmentData, legalName: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="cyber-field">
                                                        <label><AlertCircle size={14} /> Secondary Matrix (Phone)</label>
                                                        <input
                                                            type="tel" required placeholder="+977..."
                                                            value={enrollmentData.phone}
                                                            onChange={e => setEnrollmentData({ ...enrollmentData, phone: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <button disabled={!enrollmentData.legalName || !enrollmentData.phone} onClick={() => setStep(2)} className="vault-button">
                                                    Initialize Session <ChevronRight size={18} />
                                                </button>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div key="st2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                                                        <div className="cyber-field">
                                                            <label><Clock size={14} /> Temporal Origin (DOB)</label>
                                                            <input type="date" value={enrollmentData.dob} onChange={e => setEnrollmentData({ ...enrollmentData, dob: e.target.value })} />
                                                        </div>
                                                        <div className="cyber-field">
                                                            <label><Globe size={14} /> Jurisdiction</label>
                                                            <input type="text" placeholder="Nationality" value={enrollmentData.nationality} onChange={e => setEnrollmentData({ ...enrollmentData, nationality: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="cyber-field">
                                                        <label><MapPin size={14} /> Physical Coordinate (Address)</label>
                                                        <textarea placeholder="Local street address..." value={enrollmentData.address} onChange={e => setEnrollmentData({ ...enrollmentData, address: e.target.value })} style={{ minHeight: '100px', resize: 'none' }} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <button onClick={() => setStep(1)} className="vault-button secondary">Abort</button>
                                                    <button disabled={!enrollmentData.dob || !enrollmentData.nationality || !enrollmentData.address} onClick={() => setStep(3)} className="vault-button">Confirm Log <ChevronRight size={18} /></button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div key="st3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    <div className="cyber-field">
                                                        <label><Receipt size={14} /> Document Selection</label>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                            {['NID', 'Passport', 'Driving License'].map(t => (
                                                                <button key={t} onClick={() => setEnrollmentData({ ...enrollmentData, idType: t })} style={{ padding: '1rem', borderRadius: '12px', border: enrollmentData.idType === t ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.1)', background: enrollmentData.idType === t ? 'rgba(255,215,0,0.1)' : 'transparent', color: enrollmentData.idType === t ? '#FFD700' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.7rem' }}>{t}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="cyber-field">
                                                        <label><ShieldAlert size={14} /> Serial Identification</label>
                                                        <input type="text" placeholder="Reference #" value={enrollmentData.idNumber} onChange={e => setEnrollmentData({ ...enrollmentData, idNumber: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <button onClick={() => setStep(2)} className="vault-button secondary">Go Back</button>
                                                    <button disabled={!enrollmentData.idNumber} onClick={() => setStep(4)} className="vault-button">Commit Access <ChevronRight size={18} /></button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 4 && (
                                            <motion.div key="st4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    <div className="cyber-field">
                                                        <label><Camera size={14} /> Biometric Visual Match</label>
                                                        <input
                                                            type="file"
                                                            id="id-photo-upload"
                                                            accept="image/*"
                                                            onChange={handleFileUpload}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <div
                                                            style={{ height: '180px', border: '1px dashed rgba(255,215,0,0.3)', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                                                            onClick={() => document.getElementById('id-photo-upload').click()}
                                                        >
                                                            {uploading ? (
                                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ color: '#FFD700' }}>
                                                                    <CircleDashed size={30} />
                                                                </motion.div>
                                                            ) : enrollmentData.idImageUrl ? (
                                                                <img src={enrollmentData.idImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <Camera size={40} className="gold-text" style={{ opacity: 0.3, marginBottom: '10px' }} />
                                                                    <span style={{ display: 'block', opacity: 0.3, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '1px' }}>CLICK TO UPLOAD SCAN</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <button onClick={() => setStep(3)} className="vault-button secondary">Review Data</button>
                                                    <button disabled={!enrollmentData.idImageUrl || uploading} onClick={handleKycSubmit} className="vault-button" style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)', flex: 1 }}>
                                                        {loading ? 'SEALING...' : 'SEAL ENROLLMENT'} <ShieldCheck size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '6rem 4rem', textAlign: 'center' }}>
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 3 }}>
                                    <Lock size={60} strokeWidth={1} className="gold-text" style={{ marginBottom: '2rem' }} />
                                </motion.div>
                                <h2 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem' }}>SYSTEM AUDIT IN PROGRESS</h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontSize: '1rem', maxWidth: '400px', margin: '0 auto 3rem' }}>
                                    The global compliance network is currently authenticating your submitted documentation. Professional verification usually concludes within 12-24 cycles.
                                </p>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFD700', boxShadow: '0 0 10px #FFD700' }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '2px', color: '#FFD700' }}>AUDIT STATUS: ANALYZING PACKETS</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                <style jsx global>{`
                    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                    
                    .cyber-field {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .cyber-field label {
                        font-size: 0.65rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255,255,255,0.3);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .cyber-field input, .cyber-field textarea {
                        background: rgba(255,255,255,0.02);
                        border: 1px solid rgba(255,255,255,0.08);
                        padding: 1.2rem;
                        border-radius: 16px;
                        color: white;
                        font-weight: 500;
                        font-size: 0.95rem;
                        outline: none;
                        transition: all 0.3s;
                    }
                    .cyber-field input:focus, .cyber-field textarea:focus {
                        border-color: rgba(255, 215, 0, 0.4);
                        background: rgba(255,255,255,0.05);
                    }
                    .vault-button {
                        background: #FFD700;
                        color: black;
                        border: none;
                        padding: 1.5rem;
                        border-radius: 18px;
                        font-weight: 900;
                        font-size: 0.9rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        transition: all 0.3s;
                    }
                    .vault-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                    }
                    .vault-button:disabled {
                        background: rgba(255,255,255,0.05);
                        color: rgba(255,255,255,0.2);
                        cursor: not-allowed;
                    }
                    .vault-button.secondary {
                        background: rgba(255,255,255,0.05);
                        color: rgba(255,255,255,0.4);
                    }
                    .luxury-button {
                        background: linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%);
                        background-size: 200% auto;
                        color: black;
                        border: none;
                        font-weight: 900;
                        font-size: 0.8rem;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
                        box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
                    }
                    .luxury-button:hover {
                        background-position: right center;
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5);
                    }
                    .luxury-card:hover .card-image {
                        transform: scale(1.1);
                    }
                    .gold-text {
                        background: linear-gradient(135deg, #D4AF37 0%, #FFFACD 50%, #D4AF37 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.3));
                    }
                    @keyframes ticker {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-33.33%); }
                    }
                    .ticker-scroll {
                        animation: ticker 30s linear infinite;
                    }
                `}</style>

            </div>
        );
    }

    // --- APPROVED MARKETPLACE ---
    return (
        <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: '10rem', fontFamily: "'Space Grotesk', sans-serif" }}>
            <Head>
                <title>Premium Marketplace | Adgyapan</title>
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
            </Head>

            <LuxuryBackground />

            {/* Live Ticker Segment */}
            <div style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', padding: '0.5rem 0', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div className="container" style={{ display: 'flex', gap: '40px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <div className="ticker-scroll" style={{ display: 'flex', gap: '40px' }}>
                        {[...Array(3)].map((_, i) => (
                            <React.Fragment key={i}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(212, 175, 55, 0.6)', letterSpacing: '1px' }}>
                                    GLOBAL VOL: <span style={{ color: '#fff' }}>6.42M CR</span> <span style={{ color: '#00ff88' }}>+12.4%</span>
                                </div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(212, 175, 55, 0.6)', letterSpacing: '1px' }}>
                                    AVERAGE YIELD: <span style={{ color: '#fff' }}>14.2%</span>
                                </div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(212, 175, 55, 0.6)', letterSpacing: '1px' }}>
                                    ACTIVE ESTATES: <span style={{ color: '#fff' }}>1,248</span>
                                </div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(212, 175, 55, 0.6)', letterSpacing: '1px' }}>
                                    LAST CLEARANCE: <span style={{ color: '#fff' }}>RS 45,000</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <filter id="cardNoise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
            </svg>


            {/* Wallet & Status Ribbon */}
            <div style={{ background: 'rgba(255,215,0,0.05)', borderBottom: '1px solid rgba(255,215,0,0.1)', padding: '1rem 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#FFD700', color: '#000', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900 }}>VERIFIED</div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Authenticated Session: {userId.substring(0, 8)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Wallet size={16} className="gold-text" />
                                <span style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Rs {(kycData.balance || 0).toLocaleString()}</span>
                            </div>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,215,0,0.5)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pro Credit Included</span>
                        </div>
                        <button
                            onClick={() => setShowTopUp(true)}
                            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700', padding: '6px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                            TOP UP
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ position: 'relative', paddingTop: '8rem', paddingBottom: '4rem' }}>
                <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '1rem' }}>
                            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, #D4AF37)' }} />
                            <Crown size={24} className="gold-text" />
                            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(270deg, transparent, #D4AF37)' }} />
                        </div>
                        <h1 style={{
                            margin: 0,
                            fontSize: 'clamp(3rem, 8vw, 6rem)',
                            fontWeight: 400,
                            letterSpacing: '2px',
                            lineHeight: 1,
                            fontFamily: "'Playfair Display', serif",
                            textTransform: 'uppercase'
                        }}>
                            The <span className="gold-text" style={{ fontStyle: 'italic' }}>Royal</span> Exchange
                        </h1>
                        <p style={{ marginTop: '1.5rem', color: 'rgba(212, 175, 55, 0.6)', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Premium Spatial Ad Assets & Campaigns
                        </p>
                    </motion.div>
                </div>
            </div>


            <div className="container" style={{ marginTop: '5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2.5rem' }}>
                    {listings.map((listing, idx) => (
                        <TiltCard key={listing._id}>
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="luxury-card"
                                style={{
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.8) 0%, rgba(5, 5, 5, 0.9) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(212, 175, 55, 0.15)',
                                    borderRadius: '32px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                                }}
                            >
                                {/* Noise Texture Layer */}
                                <div style={{ position: 'absolute', inset: 0, filter: 'url(#cardNoise)', opacity: 0.03, pointerEvents: 'none' }} />

                                <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', aspectRatio: '16/10' }}>
                                    <img src={listing.adId.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="card-image" />
                                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.85)', padding: '6px 12px', borderRadius: '30px', border: '1px solid rgba(212, 175, 55, 0.5)', color: '#D4AF37', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(5px)' }}>
                                            <Gem size={12} /> ESTATE
                                        </div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '15px', left: '15px' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px' }}>
                                            VAULT-{(listing._id.substring(listing._id.length - 8)).toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '0 0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.5px' }}>{listing.adId.title}</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ color: 'rgba(212, 175, 55, 0.6)', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>{listing.adId.category.toUpperCase()}</span>
                                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 800 }}>TA-ID: {listing.adId._id.substring(0, 6)}</span>
                                    </div>
                                </div>


                                <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)', padding: '1.5rem', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(212, 175, 55, 0.6)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>Valuation</div>
                                        <div className="gold-text" style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-1px' }}>Rs {listing.currentHighestBid || listing.basePrice}</div>
                                    </div>
                                    <button
                                        className="luxury-button"
                                        style={{ padding: '1rem 1.8rem', borderRadius: '15px', opacity: listing.sellerId === userId ? 0.5 : 1 }}
                                        onClick={() => {
                                            if (listing.sellerId === userId) return;
                                            setSelectedListing(listing);
                                        }}
                                    >
                                        {listing.sellerId === userId ? 'OWNED' : 'ACQUIRE'}
                                    </button>
                                </div>
                            </motion.div>
                        </TiltCard>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedListing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' }}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ maxWidth: '550px', width: '100%', padding: '3rem', background: '#111', borderRadius: '40px', border: '1px solid rgba(255,215,0,0.2)' }}>
                            <button onClick={() => setSelectedListing(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ArrowRight style={{ transform: 'rotate(-45deg)' }} /></button>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>Place Escrow Bid</h2>
                            <div style={{ padding: '1.5rem', borderRadius: '20px', background: 'rgba(255,215,0,0.05)', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ opacity: 0.5 }}>Your Wallet</span>
                                    <span style={{ fontWeight: 800 }}>Rs {(kycData.balance || 0).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.5 }}>Min Step</span>
                                    <span className="gold-text" style={{ fontWeight: 800 }}>Rs {(selectedListing.currentHighestBid || selectedListing.basePrice) + 1}</span>
                                </div>
                            </div>
                            <form onSubmit={handleBid}>
                                <input type="number" required value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)', padding: '1.5rem', borderRadius: '20px', color: 'white', fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', marginBottom: '1.5rem' }} />
                                {error && <div style={{ color: '#ff4444', marginBottom: '1rem', fontWeight: 700 }}>{error}</div>}
                                {success && <div style={{ color: '#00ff88', marginBottom: '1rem', fontWeight: 700 }}>{success}</div>}
                                <button type="submit" className="premium-button" style={{ width: '100%', padding: '1.5rem', borderRadius: '20px' }}>COMMIT ESCROW BID</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* TOP UP MODAL (PREMIUM OVERHAUL 2.0) */}
                {showTopUp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.92)',
                            backdropFilter: 'blur(40px)',
                            zIndex: 5000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            style={{
                                maxWidth: '540px',
                                width: '100%',
                                padding: '4rem 3.5rem',
                                background: 'linear-gradient(165deg, #0d0d0d 0%, #050505 100%)',
                                borderRadius: '48px',
                                border: '1px solid rgba(255,215,0,0.25)',
                                boxShadow: '0 50px 150px rgba(0,0,0,1), inset 0 0 40px rgba(255,215,0,0.03)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Decorative background element */}
                            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

                            <button
                                onClick={() => setShowTopUp(false)}
                                style={{ position: 'absolute', top: '2.5rem', right: '2.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                                <motion.div
                                    animate={{
                                        boxShadow: ['0 0 20px rgba(255,215,0,0.1)', '0 0 40px rgba(255,215,0,0.3)', '0 0 20px rgba(255,215,0,0.1)']
                                    }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', width: '74px', height: '74px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.8rem', color: '#000' }}
                                >
                                    <Zap size={36} fill="black" />
                                </motion.div>
                                <h2 style={{ fontSize: '2.8rem', fontWeight: 950, marginBottom: '0.8rem', letterSpacing: '-0.04em', lineHeight: 1 }}>Boost Your <span className="gold-text">Vault</span></h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.2px' }}>Choose a strategic credit injection for your session.</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', marginBottom: '3rem' }}>
                                {[500, 1000, 5000].map((amt, i) => (
                                    <motion.button
                                        key={amt}
                                        whileHover={{ y: -8, boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => setTopUpAmount(amt.toString())}
                                        style={{
                                            padding: '2rem 0.5rem',
                                            borderRadius: '28px',
                                            border: topUpAmount === amt.toString() ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.06)',
                                            background: topUpAmount === amt.toString() ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {topUpAmount === amt.toString() && <motion.div layoutId="glow" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.1) 0%, transparent 80%)' }} />}
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: topUpAmount === amt.toString() ? 0.8 : 0.3, color: topUpAmount === amt.toString() ? '#FFD700' : '#fff' }}>
                                            {amt >= 5000 ? 'TITAN' : amt >= 1000 ? 'ELITE' : 'PRIME'}
                                        </span>
                                        <span style={{ fontWeight: 900, fontSize: '1.3rem', color: topUpAmount === amt.toString() ? '#FFD700' : 'white', letterSpacing: '-0.5px' }}>₹{amt}</span>
                                    </motion.button>
                                ))}
                            </div>

                            <form onSubmit={handleTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <div className="cyber-field" style={{ position: 'relative' }}>
                                    <label style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
                                        <ArrowRight size={14} className="gold-text" /> CUSTOM INJECTION
                                    </label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <span style={{ position: 'absolute', left: '2rem', fontSize: '1.8rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>₹</span>
                                        <input
                                            type="number" required placeholder="0.00"
                                            value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'center',
                                                fontSize: '2rem',
                                                fontWeight: 950,
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,215,0,0.15)',
                                                padding: '1.8rem 1rem 1.8rem 3rem',
                                                borderRadius: '30px',
                                                color: '#fff',
                                                outline: 'none',
                                                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                                                transition: 'all 0.3s'
                                            }}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)', e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.15)', e.currentTarget.style.background = 'rgba(0,0,0,0.3)')}
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 25px 60px rgba(255,215,0,0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={!topUpAmount}
                                    className="vault-button"
                                    style={{
                                        width: '100%',
                                        padding: '1.8rem',
                                        background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                                        color: 'black',
                                        boxShadow: '0 20px 50px rgba(255,215,0,0.2)',
                                        borderRadius: '26px',
                                        fontSize: '1rem',
                                        fontWeight: 950,
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    AUTHENTICATE & CHECKOUT <ChevronRight size={22} style={{ marginLeft: '8px' }} />
                                </motion.button>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.4 }}>
                                    <ShieldCheck size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                                        End-to-End Encrypted Verification
                                    </span>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
