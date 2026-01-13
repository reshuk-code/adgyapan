import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, User, MessageCircle, Volume2, VolumeX, Crown, Compass, ScanLine, BadgeCheck, X, Send, Search, Bell, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { useAuth } from '@clerk/nextjs';
import ShareModal from './ShareModal';

export default function VideoFeed({ ads: initialAds }) {
    const [ads, setAds] = useState(initialAds);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [sub, setSub] = useState({ plan: 'basic', status: 'active' });

    // Real-time Listeners
    useEffect(() => {
        // Dynamic import to avoid SSR issues with pusher-js
        import('pusher-js').then(({ default: Pusher }) => {
            const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
            const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

            if (!pusherKey) return;

            const pusher = new Pusher(pusherKey, {
                cluster: pusherCluster,
            });

            ads.forEach(ad => {
                const channel = pusher.subscribe(`ad-${ad._id}`);
                channel.bind('stats-update', (data) => {
                    setAds(prev => prev.map(a => {
                        if (a._id === ad._id) {
                            // Helper to update specific fields
                            if (data.increment) {
                                // For View/Click increments
                                const field = data.type === 'view' ? 'viewCount' : (data.type === 'click' ? 'clickCount' : 'likes');
                                if (data.type === 'view' || data.type === 'click') {
                                    // Views are not stored on ad object directly in this list usually, but if we display them:
                                    return { ...a, [field]: (a[field] || 0) + 1 };
                                }
                            }
                            if (data.likes !== undefined) {
                                return { ...a, likes: data.likes, likedBy: data.likedBy };
                            }
                        }
                        return a;
                    }));
                });
            });

            return () => {
                ads.forEach(ad => pusher.unsubscribe(`ad-${ad._id}`));
            };
        });
    }, [ads.length]); // Re-bind if ad list changes (e.g. infinite scroll)

    useEffect(() => {
        fetch('/api/subscriptions/me')
            .then(res => res.json())
            .then(data => { if (data.success) setSub(data.data); });
    }, []);

    const handleScroll = (e) => {
        const height = e.target.clientHeight;
        const scroll = e.target.scrollTop;
        const index = Math.round(scroll / height);
        if (index !== activeIndex) setActiveIndex(index);
    };

    const recordInterest = useCallback(async (type, slug) => {
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, type: 'interest', action: type })
            });
        } catch (e) {
            console.error('Interest track error', e);
        }
    }, []);

    // Track 5s stay (Interest) AND basic view (Feed Source)
    useEffect(() => {
        if (!ads[activeIndex]) return;
        const currentSlug = ads[activeIndex].slug;

        // 1. Track Interest (5s stay)
        const interestTimer = setTimeout(() => {
            recordInterest('stay_5s', currentSlug);
        }, 5000);

        // 2. Track View (Immediate or short delay, e.g. 1s)
        const viewTimer = setTimeout(() => {
            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: currentSlug,
                    type: 'view',
                    source: 'feed'
                })
            }).catch(e => console.error('View track error', e));
        }, 1000); // 1-second threshold for a "view"

        return () => {
            clearTimeout(interestTimer);
            clearTimeout(viewTimer);
        };
    }, [activeIndex, ads, recordInterest]);

    const updateAdData = (updatedAd) => {
        setAds(prev => prev.map(ad => ad._id === updatedAd._id ? updatedAd : ad));
    };

    return (
        <div
            className="feed-container"
            onScroll={handleScroll}
            onContextMenu={(e) => e.preventDefault()}
            style={{
                height: '100dvh',
                width: '100%',
                overflowY: 'scroll',
                scrollSnapType: 'y mandatory',
                scrollbarWidth: 'none',
                backgroundColor: '#000',
                msOverflowStyle: 'none'
            }}
        >

            {
                ads.map((ad, index) => (
                    <VideoCard
                        key={ad._id}
                        ad={ad}
                        isActive={index === activeIndex}
                        isMuted={isMuted}
                        volume={volume}
                        onMute={() => setIsMuted(!isMuted)}
                        onVolume={(v) => {
                            setVolume(v);
                            if (v > 0) setIsMuted(false);
                            else setIsMuted(true);
                        }}
                        onUpdate={updateAdData}
                        onInterest={recordInterest}
                    />
                ))
            }
        </div >
    );
}

function VideoCard({ ad, isActive, isMuted, volume, onMute, onVolume, onUpdate, onInterest }) {
    const videoRef = useRef(null);
    const { userId } = useAuth();
    const [qrSrc, setQrSrc] = useState('');
    const [showQr, setShowQr] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isPressing, setIsPressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(null);
    const [showLocalVolume, setShowLocalVolume] = useState(false);
    const pressTimer = useRef(null);

    const liked = ad.likedBy?.includes(userId);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log('Autoplay blocked', e));
        } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    // Sync volume when prop changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(p);
        }
    };

    const togglePlay = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
                setShowPlayPauseIcon('play');
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
                setShowPlayPauseIcon('pause');
            }
            setTimeout(() => setShowPlayPauseIcon(null), 800);
        }
    };

    const handleStartPress = () => {
        pressTimer.current = setTimeout(() => {
            setIsPressing(true);
        }, 300);
    };

    const handleEndPress = () => {
        clearTimeout(pressTimer.current);
        setIsPressing(false);
    };

    const generateQR = async () => {
        if (qrSrc) { setShowQr(true); return; }
        // For AR scanning, use /ad/slug directly (without /view)
        const url = `${window.location.origin}/ad/${ad.slug || ad._id}`;
        try {
            const src = await QRCode.toDataURL(url, { margin: 2, dark: '#000000', light: '#ffffff' });
            setQrSrc(src);
            setShowQr(true);
        } catch (err) { console.error(err); }
    };

    const handleLike = async () => {
        if (!userId) {
            alert('Please sign in to join the community and like ads! 🚀');
            return;
        }
        try {
            const res = await fetch(`/api/ads/${ad._id}/like`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                onUpdate(data.data);
            }
        } catch (err) { console.error(err); }
    };

    const handleShare = () => {
        // Just open the modal, don't count share yet
        setShowShareModal(true);
    };

    const handleShareAction = async () => {
        try {
            const res = await fetch(`/api/ads/${ad._id}/share`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                onUpdate(data.data);
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
            onClick={togglePlay}
            style={{
                height: '100dvh',
                width: '100%',
                scrollSnapAlign: 'start',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#000',
                userSelect: 'none',
                overflow: 'hidden',
                cursor: 'pointer'
            }}
        >
            {/* Video Background */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <video
                    ref={videoRef}
                    src={ad.videoUrl}
                    loop
                    muted={isMuted}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => setProgress(0)}
                    playsInline
                    style={{
                        height: '100%',
                        width: '100%',
                        objectFit: 'cover',
                        filter: isActive ? (isPressing ? 'blur(15px) brightness(0.7)' : 'none') : 'blur(25px) brightness(0.5)',
                        transition: 'filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                />
            </div>

            {/* Play/Pause Icon Overlay */}
            <AnimatePresence>
                {showPlayPauseIcon && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        style={{
                            position: 'absolute',
                            zIndex: 150,
                            pointerEvents: 'none',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(5px)',
                            borderRadius: '50%',
                            padding: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        {showPlayPauseIcon === 'play' ? <Play size={40} fill="white" color="white" /> : <Pause size={40} fill="white" color="white" />}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'rgba(255,255,255,0.15)',
                zIndex: 100,
                overflow: 'hidden'
            }}>
                <motion.div
                    style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #fe2c55, #ff0080)',
                        width: `${progress}%`,
                        boxShadow: '0 0 10px rgba(254, 44, 85, 0.8)'
                    }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                />
            </div>

            {/* Long Press Preview (Thumbnail) */}
            <AnimatePresence>
                {isPressing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 10 }}
                        style={{
                            position: 'absolute',
                            width: '80%',
                            maxWidth: '400px',
                            aspectRatio: '1',
                            zIndex: 200,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                            borderRadius: '2rem',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.3)',
                            background: '#111'
                        }}
                    >
                        <img src={ad.imageUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '1.25rem',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                            color: 'white',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                        }}>
                            POINT CAMERA AT THIS TARGET
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlays */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.4) 100%)',
                pointerEvents: 'none'
            }} />

            {/* Content Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isActive ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                    position: 'absolute',
                    bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 20px))',
                    left: '1.5rem',
                    color: 'white',
                    maxWidth: 'calc(100% - 140px)',
                    zIndex: 10
                }}

            >
                <Link
                    href={`/profile/${ad.userId}`}
                    onClick={() => onInterest('profile_visit', ad.slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.8)',
                        overflow: 'hidden',
                        background: '#111',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        flexShrink: 0
                    }}>
                        {ad.authorAvatar ? <img src={ad.authorAvatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User style={{ padding: '8px', width: '100%', height: '100%' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: '900', fontSize: '1rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>@{ad.authorName || 'adgyapan'}</span>
                            {ad.userPlan === 'pro' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    style={{ color: '#f59e0b', display: 'flex' }}
                                >
                                    <BadgeCheck size={16} fill="#f59e0b" color="black" strokeWidth={1.5} />
                                </motion.div>
                            )}
                        </div>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: '700' }}>view creator info</span>
                    </div>
                </Link>

                {ad.category && (
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        color: 'var(--accent, #3b82f6)',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        marginBottom: '0.5rem',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        #{ad.category}
                    </div>
                )}
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '900',
                    marginBottom: '0.75rem',
                    letterSpacing: '-0.5px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                    lineHeight: '1.2'
                }}>{ad.title}</h2>

                <div style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(30px)',
                    padding: '0.4rem 1rem',
                    borderRadius: '2rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontWeight: '800',
                    color: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                    <Compass size={14} strokeWidth={3} /> INTERACTIVE AR AD
                </div>
            </motion.div>

            {/* Sidebar Interactions */}
            <div style={{
                position: 'absolute',
                bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 20px))',
                right: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div className="action-btn" onClick={(e) => { e.stopPropagation(); handleLike(); }}>
                    <motion.div
                        whileTap={{ scale: 0.8 }}
                        className="icon-wrapper"
                    >
                        <Heart
                            size={28}
                            fill={liked ? "#fe2c55" : "none"}
                            color={liked ? "#fe2c55" : "white"}
                            strokeWidth={2.5}
                        />
                    </motion.div>
                    <span className="count-label">{ad.likes || 0}</span>
                </div>

                <div className="action-btn" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
                    <motion.div whileTap={{ scale: 0.8 }} className="icon-wrapper">
                        <MessageCircle size={28} color="white" strokeWidth={2.5} />
                    </motion.div>
                    <span className="count-label">{ad.comments?.length || 0}</span>
                </div>

                <div
                    className="action-btn"
                    onMouseEnter={() => setShowLocalVolume(true)}
                    onMouseLeave={() => setShowLocalVolume(false)}
                    style={{ position: 'relative' }}
                >
                    <AnimatePresence>
                        {showLocalVolume && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: -70 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    zIndex: 100,
                                    height: '140px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => onVolume(parseFloat(e.target.value))}
                                    style={{
                                        WebkitAppearance: 'slider-vertical',
                                        appearance: 'slider-vertical',
                                        width: '8px',
                                        height: '100px',
                                        cursor: 'pointer'
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.div
                        whileTap={{ scale: 0.8 }}
                        className="icon-wrapper"
                        onClick={(e) => { e.stopPropagation(); onMute(); }}
                    >
                        {isMuted || volume === 0 ? <VolumeX size={24} color="white" strokeWidth={2.5} /> : <Volume2 size={24} color="white" strokeWidth={2.5} />}
                    </motion.div>
                    <span className="count-label">AUDIO</span>
                </div>

                <div className="action-btn" onClick={(e) => { e.stopPropagation(); generateQR(); }}>
                    <motion.div whileTap={{ scale: 0.8 }} className="icon-wrapper" style={{ background: 'white' }}>
                        <ScanLine size={24} color="black" strokeWidth={3} />
                    </motion.div>
                    <span className="count-label" style={{ fontSize: '0.65rem' }}>SCAN AR</span>
                </div>

                <div className="action-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                    <motion.div whileTap={{ scale: 0.8 }} className="icon-wrapper">
                        <Share2 size={24} color="white" strokeWidth={2.5} />
                    </motion.div>
                    <span className="count-label">{ad.shares || 0}</span>
                </div>
            </div>

            {/* Comment Drawer */}
            <CommentDrawer ad={ad} isOpen={showComments} onClose={() => setShowComments(false)} onUpdate={onUpdate} />

            {/* QR Overlay */}
            <AnimatePresence>
                {showQr && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.95)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '2rem',
                            backdropFilter: 'blur(10px)'
                        }}
                        onClick={() => setShowQr(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass-card"
                            style={{
                                padding: '2.5rem',
                                textAlign: 'center',
                                maxWidth: '380px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '2rem',
                                background: 'rgba(30,30,30,0.8)',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.8)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem', fontWeight: '1000', letterSpacing: '-1px' }}>Ready for AR?</h3>
                            <div style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '1.5rem',
                                marginBottom: '1.5rem',
                                boxShadow: '0 10px 40px rgba(255,255,255,0.1)',
                                border: '4px solid white'
                            }}>
                                <img src={qrSrc} alt="QR" style={{ width: '100%', display: 'block' }} />
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '2rem', opacity: 0.8, lineHeight: '1.5', fontWeight: '600' }}>
                                1. Open your phone camera<br />
                                2. Scan this code<br />
                                3. Point at the physical ad
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowQr(false)} style={{
                                width: '100%',
                                fontWeight: '900',
                                padding: '1rem',
                                borderRadius: '1rem',
                                fontSize: '1rem',
                                background: 'white',
                                color: 'black'
                            }}>Done</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                ad={ad}
                onShare={handleShareAction}
            />
        </div>
    );
}

function CommentDrawer({ ad, isOpen, onClose, onUpdate }) {
    const { userId } = useAuth();
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState(null); // { id, name }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const submitComment = async () => {
        if (!text.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const url = replyTo
                ? `/api/ads/${ad._id}/comment/${replyTo.id}/reply`
                : `/api/ads/${ad._id}/comment`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            if (data.success) {
                onUpdate(data.data);
                setText('');
                setReplyTo(null);
            } else {
                if (res.status === 401) {
                    alert('Please sign in to join the conversation! 💬');
                } else {
                    alert('Error: ' + (data.error || 'Failed to post'));
                }
            }
        } catch (err) {
            console.error(err);
            alert('Connection error');
        }
        setIsSubmitting(false);
    };

    const toggleCommentLike = async (e, commentId) => {
        e.stopPropagation();
        if (!userId) return alert('Sign in to like comments! ❤️');
        try {
            const res = await fetch(`/api/ads/${ad._id}/comment/${commentId}/like`, { method: 'POST' });
            const data = await res.json();
            if (data.success) onUpdate(data.data);
        } catch (err) { console.error(err); }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '75%',
                            background: '#0a0a0a',
                            borderTopLeftRadius: '2.5rem',
                            borderTopRightRadius: '2.5rem',
                            zIndex: 1001,
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            borderTop: '1px solid rgba(255,255,255,0.12)',
                            color: 'white',
                            boxShadow: '0 -20px 60px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div style={{ width: '45px', height: '5px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', margin: '0 auto 1.5rem', flexShrink: 0 }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '1000', letterSpacing: '-0.5px' }}>COMMENTS ({ad.comments?.length || 0})</h3>
                            <div onClick={onClose} style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={20} color="white" strokeWidth={3} />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', padding: '0 0.5rem', scrollbarWidth: 'none' }}>
                            {ad.comments?.length > 0 ? (
                                ad.comments.map((c, i) => (
                                    <div key={c._id || i} style={{ marginBottom: '1.75rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                {c.userAvatar ? <img src={c.userAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} style={{ padding: '8px', color: 'rgba(255,255,255,0.4)' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: '1000', marginBottom: '2px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            @{c.userName}
                                                            {c.userPlan === 'pro' && (
                                                                <BadgeCheck size={12} fill="#f59e0b" color="black" strokeWidth={1.5} />
                                                            )}
                                                            {c.userId === ad.userId && (
                                                                <span style={{ fontSize: '0.6rem', color: '#fe2c55', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(254,44,85,0.3)', textTransform: 'uppercase', marginLeft: '2px' }}>Creator</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.5', fontWeight: '500' }}>{c.text}</div>
                                                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '8px', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                                                                {mounted ? new Date(c.createdAt).toLocaleDateString() : ''}
                                                            </span>
                                                            <span
                                                                onClick={() => setReplyTo({ id: c._id, name: c.userName })}
                                                                style={{ fontSize: '0.7rem', fontWeight: '1000', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                                            >Reply</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        onClick={(e) => toggleCommentLike(e, c._id)}
                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', paddingLeft: '1rem', paddingTop: '0.2rem' }}
                                                    >
                                                        <Heart size={16} fill={c.likedBy?.includes(userId) ? "#fe2c55" : "none"} color={c.likedBy?.includes(userId) ? "#fe2c55" : "rgba(255,255,255,0.3)"} strokeWidth={2.5} />
                                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>{c.likes || 0}</span>
                                                    </div>
                                                </div>

                                                {/* Replies Container */}
                                                {c.replies?.length > 0 && (
                                                    <div style={{ marginTop: '1rem', paddingLeft: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.05)' }}>
                                                        {c.replies.map((r, ri) => (
                                                            <div key={ri} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                                                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    {r.userAvatar ? <img src={r.userAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={12} style={{ padding: '4px', color: 'rgba(255,255,255,0.2)' }} />}
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        @{r.userName}
                                                                        {r.userPlan === 'pro' && (
                                                                            <BadgeCheck size={10} fill="#f59e0b" color="black" strokeWidth={1.5} />
                                                                        )}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>{r.text}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <MessageCircle size={50} opacity={0.1} strokeWidth={1} />
                                    <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>No comments yet.<br />Be the first to share your thoughts!</p>
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {replyTo && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: '1rem 1rem 0 0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid rgba(59,130,246,0.3)',
                                        borderBottom: 'none',
                                        margin: '0 0.5rem'
                                    }}
                                >
                                    <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: '800' }}>REPLYING TO <strong style={{ color: '#fff' }}>@{replyTo.name}</strong></span>
                                    <X size={14} color="#60a5fa" style={{ cursor: 'pointer' }} onClick={() => setReplyTo(null)} strokeWidth={3} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            background: '#1a1a1a',
                            padding: '0.8rem 1.25rem',
                            borderRadius: replyTo ? '0 0 1.5rem 1.5rem' : '1.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            alignItems: 'center',
                            margin: '0 0.5rem 1rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}>
                            <input
                                className="input"
                                style={{ background: 'transparent', border: 'none', padding: 0, color: 'white', flex: 1, fontSize: '0.95rem', outline: 'none', fontWeight: '600' }}
                                placeholder={replyTo ? "Add a reply..." : "Add a comment..."}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                            />
                            <motion.div
                                whileTap={{ scale: 0.8 }}
                                onClick={submitComment}
                                style={{ cursor: 'pointer', color: text.trim() ? '#fff' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}
                            >
                                <Send size={22} fill={text.trim() ? '#fff' : 'none'} strokeWidth={2.5} />
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
