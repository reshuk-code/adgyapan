import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

const BEHAVIOR_VARIANTS = {
    float: {
        y: [0, -10, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    pulse: {
        scale: [1, 1.05, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    glitch: {
        x: [0, -3, 3, -1, 0],
        transition: { duration: 0.3, repeat: Infinity, repeatDelay: 5 }
    },
    static: {}
};

const ENVIRONMENT_FILTERS = {
    studio: 'contrast(1.05) brightness(1.05)',
    outdoor: 'saturate(1.3) contrast(1.1)',
    night: 'hue-rotate(220deg) brightness(0.7) contrast(1.3)',
    cyberpunk: 'hue-rotate(280deg) saturate(2) contrast(1.2) brightness(1.1)'
};

const PRESET_STYLES = {
    standard: {},
    glass: {
        backdropFilter: 'blur(10px)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)'
    },
    neon: {
        border: '2px solid #FFD700',
        boxShadow: '0 0 20px #FFD700, inset 0 0 10px #FFD700'
    },
    frosted: {
        backdropFilter: 'blur(20px) contrast(1.1)',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.2)'
    }
};

export default function EmbedAd() {
    const router = useRouter();
    const { apiKey, pin } = router.query;
    const [adData, setAdData] = useState(null);
    const [error, setError] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [leadFormData, setLeadFormData] = useState({});
    const [leadSubmitting, setLeadSubmitting] = useState(false);
    const [leadSubmitted, setLeadSubmitted] = useState(false);

    useEffect(() => {
        if (!apiKey || !pin) return;
        fetch(`/api/ads/embed?apiKey=${apiKey}&pin=${pin}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAdData(data.data);
                } else {
                    setError(data.error);
                }
            })
            .catch(err => setError(err.message));
    }, [apiKey, pin]);

    const handleInteraction = (type) => {
        if (type === 'enter') {
            setIsHovered(true);
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.log("Playback blocked", e));
                setIsPlaying(true);
            }
        } else {
            setIsHovered(false);
            if (videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    if (error) return <div style={{ color: 'white', background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>{error}</div>;
    if (!adData) return <div style={{ color: 'white', background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Connecting...</div>;

    const { overlay, cta, title, optimizedVideoUrl, videoUrl, thumbnailUrl } = adData;

    return (
        <>
            <Head>
                <title>{title} | Adgyapan Embed</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
            </Head>

            <div
                style={{
                    position: 'relative',
                    height: '100vh',
                    width: '100vw',
                    background: '#000',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    filter: ENVIRONMENT_FILTERS[adData.overlay?.environment || 'studio']
                }}
                onMouseEnter={() => handleInteraction('enter')}
                onMouseLeave={() => handleInteraction('leave')}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => {
                    const v = videoRef.current;
                    if (v) {
                        if (v.paused) v.play();
                        else v.pause();
                        setIsPlaying(!v.paused);
                    }
                }}
            >
                {/* Main Ad Display */}
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                    {/* Static Thumbnail (Layered for smooth transitions) */}
                    <img
                        src={thumbnailUrl}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: isPlaying ? 0 : 1,
                            transition: 'opacity 0.4s ease-in-out',
                            zIndex: isPlaying ? 1 : 10,
                            pointerEvents: 'none' // Prevent thumbnail interaction
                        }}
                        alt={title}
                    />

                    {/* Video Player & AR Frame */}
                    <motion.div
                        animate={BEHAVIOR_VARIANTS[adData.overlay?.behavior || 'float']}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            ...PRESET_STYLES[adData.overlay?.preset || 'standard']
                        }}
                    >
                        <video
                            ref={videoRef}
                            src={optimizedVideoUrl || videoUrl}
                            poster={thumbnailUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                zIndex: 5
                            }}
                            loop
                            muted
                            playsInline
                            disablePictureInPicture
                            disableRemotePlayback
                            controlsList="nodownload noplaybackrate"
                            onContextMenu={(e) => e.preventDefault()}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                    </motion.div>

                    {/* Glossy Overlay & UI */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)',
                        zIndex: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '1.5rem',
                        transition: 'opacity 0.3s',
                        zIndex: 20
                    }}>
                        {/* Header Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.65rem', color: '#00ff88', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Interactive Ad
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                {adData.overlay?.showQR && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowQRModal(true);
                                        }}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            backdropFilter: 'blur(10px)',
                                            padding: '5px 10px',
                                            borderRadius: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            color: '#fff',
                                            fontSize: '0.6rem',
                                            fontWeight: 700
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M16 16v.01" /><path d="M21 16v.01" /><path d="M16 21v.01" /></svg>
                                        Scan to Real AR
                                    </motion.button>
                                )}

                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(window.location.origin, '_blank');
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '5px 12px',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 600 }}>Powered by</span>
                                    <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.5px' }}>ADGYAPAN</span>
                                </motion.div>
                            </div>
                        </div>

                        {/* Bottom Info & CTA */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ transition: 'transform 0.3s ease', transform: isHovered ? 'translateY(0)' : 'translateY(10px)' }}>
                                <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{title}</h2>
                                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', fontSize: '0.75rem' }}>
                                    {isHovered ? 'Playing now...' : 'Hover to play'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {cta && cta.text && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (adData.cta?.type === 'lead_form') {
                                                setShowLeadModal(true);
                                            } else if (cta.url) {
                                                window.open(cta.url, '_blank');
                                            }
                                        }}
                                        style={{
                                            background: cta.color || '#fff',
                                            color: '#000',
                                            border: 'none',
                                            padding: '0.8rem 1.5rem',
                                            borderRadius: '12px',
                                            fontWeight: 900,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {cta.text}
                                    </motion.button>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`${window.location.origin}/ad/${adData.campaignId}/views`, '_blank');
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        padding: '0.8rem 1.25rem',
                                        borderRadius: '12px',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    View in Feed
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Play/Pause Indicator */}
                    <AnimatePresence>
                        {!isPlaying && !isHovered && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                style={{
                                    position: 'absolute',
                                    zIndex: 4,
                                    width: '60px',
                                    height: '60px',
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }}
                            >
                                <div style={{
                                    width: 0,
                                    height: 0,
                                    borderStyle: 'solid',
                                    borderWidth: '10px 0 10px 18px',
                                    borderColor: 'transparent transparent transparent #fff',
                                    marginLeft: '4px'
                                }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* QR Code Modal for Mobile AR */}
                <AnimatePresence>
                    {showQRModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 10000,
                                background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                style={{
                                    background: '#111', borderRadius: '32px', padding: '2.5rem',
                                    maxWidth: '400px', width: '100%', border: '1px solid rgba(255,255,255,0.1)',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>Experience in Real AR</h3>
                                <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '2rem' }}>
                                    Scan this code with your phone to place this experience in your physical space.
                                </p>

                                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', display: 'inline-block', marginBottom: '2rem' }}>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/ad/' + adData.slug)}`}
                                        alt="QR Code"
                                        style={{ width: '200px', height: '200px' }}
                                    />
                                </div>

                                <button
                                    onClick={() => setShowQRModal(false)}
                                    style={{
                                        width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)',
                                        color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px',
                                        fontWeight: 800, cursor: 'pointer'
                                    }}
                                >
                                    Got it
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lead Capture Modal */}
                <AnimatePresence>
                    {showLeadModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 9999,
                                background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                style={{
                                    background: '#0a0a0a', borderRadius: '24px', padding: '2.5rem',
                                    maxWidth: '450px', width: '100%', border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative'
                                }}
                            >
                                {!leadSubmitted ? (
                                    <>
                                        <button
                                            onClick={() => setShowLeadModal(false)}
                                            style={{
                                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                                background: 'none', border: 'none', color: '#a1a1aa',
                                                fontSize: '1.5rem', cursor: 'pointer'
                                            }}
                                        >✕</button>

                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>{title}</h2>
                                        <p style={{ color: '#71717a', marginBottom: '2rem', fontSize: '0.9rem' }}>Syndicated via Partner Network</p>

                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                setLeadSubmitting(true);
                                                try {
                                                    const res = await fetch('/api/leads/capture', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            adId: adData.campaignId,
                                                            leadData: leadFormData,
                                                            source: 'embed',
                                                            apiKey, // CRITICAL: Identify this as a buyer lead
                                                            pin
                                                        })
                                                    });
                                                    if (res.ok) setLeadSubmitted(true);
                                                    else alert('Submission failed');
                                                } catch (err) { alert('Error submitting'); }
                                                finally { setLeadSubmitting(false); }
                                            }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                                        >
                                            <input
                                                type="text" placeholder="Name" required
                                                value={leadFormData.name || ''}
                                                onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                                                style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                            />
                                            <input
                                                type="email" placeholder="Email" required
                                                value={leadFormData.email || ''}
                                                onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                                                style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                            />
                                            <button
                                                type="submit" disabled={leadSubmitting}
                                                style={{
                                                    width: '100%', padding: '1rem', background: cta.color || '#fff',
                                                    color: '#000', border: 'none', borderRadius: '12px', fontWeight: 900
                                                }}
                                            >
                                                {leadSubmitting ? 'Submitting...' : 'Submit'}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Success!</h3>
                                        <p style={{ color: '#71717a' }}>Lead captured. Thank you!</p>
                                        <button onClick={() => setShowLeadModal(false)} className="btn btn-secondary">Close</button>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
