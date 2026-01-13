import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmbedAd() {
    const router = useRouter();
    const { apiKey, pin } = router.query;
    const [adData, setAdData] = useState(null);
    const [error, setError] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

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
                    cursor: 'pointer'
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

                    {/* Video Player */}
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

                            {/* Branding Badge */}
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
                                            if (cta.url) window.open(cta.url, '_blank');
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
            </div>
        </>
    );
}
