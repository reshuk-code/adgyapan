
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';

const ensureAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export default function AdView() {
    const router = useRouter();
    const { slug } = router.query;
    const [ad, setAd] = useState(null);
    const [error, setError] = useState(null);
    const [showCta, setShowCta] = useState(false);
    const [arReady, setArReady] = useState(false);
    const [isActive, setIsActive] = useState(false); // For screenTime
    const [isMuted, setIsMuted] = useState(true);
    const [targetFound, setTargetFound] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [leadFormData, setLeadFormData] = useState({});
    const [leadSubmitting, setLeadSubmitting] = useState(false);
    const [leadSubmitted, setLeadSubmitted] = useState(false);

    useEffect(() => {
        // Polling to detect when scripts are loaded
        const interval = setInterval(() => {
            if (window.AFRAME && window.MINDAR) {
                setArReady(true);
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // ScreenTime heart-beat
    useEffect(() => {
        if (!slug || !isActive) return;

        const interval = setInterval(() => {
            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, type: 'screenTime', duration: 10 })
            });
        }, 10000); // Track every 10 seconds

        return () => clearInterval(interval);
    }, [slug, isActive]);

    useEffect(() => {
        if (!slug) return;

        fetch(`/api/ad/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAd(data.data);
                    setIsActive(true);
                    // Track view on load
                    fetch('/api/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ slug: data.data.slug, type: 'view' })
                    });
                } else {
                    setError(data.error);
                }
            })
            .catch(err => setError(err.message));
    }, [slug]);

    if (error) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Error: {error}</div>;
    if (!ad) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading Ad...</div>;

    // Defaults if old ad
    const overlay = ad.overlay || { scale: 1, opacity: 1, rotation: 0, positionX: 0, positionY: 0 };

    return (
        <>
            <Head>
                <title>{ad.title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" />
                <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js"></script>
            </Head>

            <Script id="ar-ready-check" strategy="afterInteractive">
                {`
            AFRAME.registerComponent('glitch', {
                schema: {enabled: {type: 'boolean', default: false}},
                tick: function (time, timeDelta) {
                    if (!this.data.enabled) return;
                    if (Math.random() > 0.98) {
                        this.el.setAttribute('position', {
                            x: (Math.random() - 0.5) * 0.05,
                            y: (Math.random() - 0.5) * 0.05,
                            z: (Math.random() - 0.5) * 0.02
                        });
                    } else {
                        this.el.setAttribute('position', {x: 0, y: 0, z: 0});
                    }
                }
            });

            const checkAR = setInterval(() => {
                if (window.MINDAR) {
                    clearInterval(checkAR);
                }
            }, 500);
        `}
            </Script>

            <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>

                {!arReady && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', zIndex: 999 }}>Initializing AR...</div>}

                {arReady && (
                    <a-scene
                        mindar-image={`imageTargetSrc: ${ad.targetUrl}; filterMinCF:0.0005; filterBeta: 0.005; missTolerance: 5;`}
                        color-space="sRGB"
                        renderer="colorManagement: true, physicallyCorrectLights"
                        vr-mode-ui="enabled: false"
                        device-orientation-permission-ui="enabled: false"
                    >
                        <a-assets>
                            <video
                                id="vid"
                                src={ad.videoUrl}
                                preload="auto"
                                loop={true}
                                crossOrigin="anonymous"
                                playsInline
                                webkit-playsinline="true"
                                muted
                            ></video>
                        </a-assets>

                        <a-camera position="0 0 0" look-controls="enabled: false">
                            <a-cursor
                                fuse="false"
                                raycaster="objects: .clickable"
                                material="color: #FFD700; shader: flat"
                            ></a-cursor>
                        </a-camera>

                        <a-entity
                            mindar-image-target="targetIndex: 0"
                            id="target-entity"
                            ref={entity => {
                                if (entity) {
                                    entity.addEventListener("targetFound", () => {
                                        const v = document.querySelector('#vid');
                                        if (v) v.play();
                                        setShowCta(true);
                                        setTargetFound(true);
                                    });
                                    entity.addEventListener("targetLost", () => {
                                        setTargetFound(false);
                                        if (!ad.isPersistent) {
                                            const v = document.querySelector('#vid');
                                            if (v) v.pause();
                                            setShowCta(false);
                                        } else {
                                            // Handle persistence: force visibility
                                            setTimeout(() => {
                                                const ent = document.querySelector('#target-entity');
                                                if (ent) ent.setAttribute('visible', 'true');
                                            }, 10);
                                        }
                                    });
                                }
                            }}
                        >
                            <a-entity
                                position={`${overlay.positionX || 0} ${overlay.positionY || 0} 0`}
                                rotation={`${overlay.rotationX || 0} ${overlay.rotationY || 0} ${overlay.rotation || 0}`}
                                scale={`${overlay.scale || 1} ${overlay.scale || 1} 1`}
                                animation={overlay.behavior === 'float' ? "property: position; to: 0 0.05 0; dur: 2000; dir: alternate; loop: true; easing: easeInOutSine" : (overlay.behavior === 'pulse' ? "property: scale; to: 1.05 1.05 1; dur: 1000; dir: alternate; loop: true; easing: easeInOutSine" : "")}
                                glitch={`enabled: ${overlay.behavior === 'glitch'}`}
                            >
                                <a-plane
                                    src="#vid"
                                    position="0 0 0"
                                    height={`${1 / (overlay.aspectRatio || 1.777)}`}
                                    width="1"
                                    opacity={overlay.opacity || 1}
                                    className="clickable"
                                    material={overlay.preset === 'glass' ? "opacity: 0.8; transparent: true; roughness: 0" : (overlay.preset === 'frosted' ? "opacity: 0.9; transparent: true; roughness: 1" : "")}
                                    onClick={() => {
                                        const v = document.querySelector('#vid');
                                        if (v) {
                                            v.play();
                                            v.muted = false;
                                            setIsMuted(false);
                                        }
                                    }}
                                ></a-plane>

                                {overlay.preset === 'neon' && (
                                    <a-plane
                                        position="0 0 -0.01"
                                        width="1.05"
                                        height={`${(1 / (overlay.aspectRatio || 1.777)) + 0.05}`}
                                        material="color: #FFD700; shader: flat; opacity: 0.5; transparent: true"
                                        animation="property: material.opacity; to: 1; dur: 500; dir: alternate; loop: true"
                                    ></a-plane>
                                )}

                                {/* Spatial CTA Button */}
                                {ad.ctaText && (
                                    <a-entity
                                        position={`${ad.ctaPositionX || 0} ${ad.ctaPositionY || -0.5} 0.02`}
                                        scale={`${ad.ctaScale || 1} ${ad.ctaScale || 1} 1`}
                                    >
                                        <a-plane
                                            className="clickable"
                                            width="1.2"
                                            height="0.4"
                                            material={`color: ${ad.ctaColor || '#000'}; opacity: 0.9; transparent: true`}
                                            onClick={() => {
                                                // Handle different CTA types
                                                if (ad.ctaType === 'lead_form') {
                                                    setShowLeadModal(true);
                                                } else if (ad.ctaType === 'phone' && ad.ctaUrl) {
                                                    window.location.href = `tel:${ad.ctaUrl}`;
                                                } else if (ad.ctaType === 'email' && ad.ctaUrl) {
                                                    window.location.href = `mailto:${ad.ctaUrl}`;
                                                } else if (ad.ctaUrl) {
                                                    window.open(ensureAbsoluteUrl(ad.ctaUrl), '_blank');
                                                }

                                                fetch('/api/track', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ slug: ad.slug, type: 'click' })
                                                });
                                            }}
                                        >
                                            <a-text
                                                value={ad.ctaText}
                                                align="center"
                                                width="2.5"
                                                color="#fff"
                                                font="https://cdn.aframe.io/fonts/Exo2Bold.fnt"
                                            ></a-text>
                                        </a-plane>
                                        {/* Backplane for depth/contrast */}
                                        <a-plane
                                            width="1.3"
                                            height="0.5"
                                            position="0 0 -0.01"
                                            material={`color: ${ad.ctaColor || '#FFD700'}; opacity: 0.4`}
                                        ></a-plane>
                                    </a-entity>
                                )}
                            </a-entity>
                        </a-entity>
                    </a-scene>
                )}

                {/* AR Watermark (Basic Users Only) */}
                {ad.userPlan !== 'pro' && ad.userPlan !== 'enterprise' && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        pointerEvents: 'none',
                        opacity: 0.8
                    }}>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Made with</span>
                        <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 900, letterSpacing: '-0.5px' }}>Adgyapan</span>
                    </div>
                )}

                {/* Unmute Prompt */}
                {targetFound && isMuted && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2000,
                        textAlign: 'center'
                    }}>
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '12px 24px',
                                background: 'white',
                                color: 'black',
                                border: 'none',
                                borderRadius: '30px',
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                const v = document.querySelector('#vid');
                                if (v) {
                                    v.play();
                                    v.muted = false;
                                    setIsMuted(false);
                                }
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                            TAP TO ENABLE SOUND
                        </motion.button>
                    </div>
                )}

                {/* Lead Capture Modal */}
                <AnimatePresence>
                    {showLeadModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 9999,
                                background: 'rgba(0,0,0,0.9)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1.5rem'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                style={{
                                    background: '#0a0a0a',
                                    borderRadius: '24px',
                                    padding: '2.5rem',
                                    maxWidth: '450px',
                                    width: '100%',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                                }}
                            >
                                {!leadSubmitted ? (
                                    <>
                                        <button
                                            onClick={() => setShowLeadModal(false)}
                                            style={{
                                                position: 'absolute',
                                                top: '1.5rem',
                                                right: '1.5rem',
                                                background: 'none',
                                                border: 'none',
                                                color: '#a1a1aa',
                                                fontSize: '1.5rem',
                                                cursor: 'pointer',
                                                padding: 0,
                                                lineHeight: 1
                                            }}
                                        >
                                            ✕
                                        </button>

                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>
                                            {ad.title}
                                        </h2>
                                        <p style={{ color: '#71717a', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                            Share your details to connect with us
                                        </p>

                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                setLeadSubmitting(true);

                                                try {
                                                    const res = await fetch('/api/leads/capture', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            adId: ad._id,
                                                            leadData: leadFormData,
                                                            source: 'ar_view'
                                                        })
                                                    });

                                                    if (res.ok) {
                                                        setLeadSubmitted(true);
                                                        // Track lead event
                                                        fetch('/api/track', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ slug: ad.slug, type: 'lead' })
                                                        });
                                                    } else {
                                                        alert('Failed to submit. Please try again.');
                                                    }
                                                } catch (error) {
                                                    alert('Error submitting form');
                                                } finally {
                                                    setLeadSubmitting(false);
                                                }
                                            }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                                        >
                                            {ad.leadFormFields?.includes('name') && (
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Name *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={leadFormData.name || ''}
                                                        onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                                                        style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
                                                    />
                                                </div>
                                            )}

                                            {ad.leadFormFields?.includes('email') && (
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email *</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={leadFormData.email || ''}
                                                        onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                                                        style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
                                                    />
                                                </div>
                                            )}

                                            {ad.leadFormFields?.includes('phone') && (
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone</label>
                                                    <input
                                                        type="tel"
                                                        value={leadFormData.phone || ''}
                                                        onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                                                        style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
                                                    />
                                                </div>
                                            )}

                                            {ad.leadFormFields?.includes('company') && (
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Company</label>
                                                    <input
                                                        type="text"
                                                        value={leadFormData.company || ''}
                                                        onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value })}
                                                        style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
                                                    />
                                                </div>
                                            )}

                                            {ad.leadFormFields?.includes('message') && (
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Message</label>
                                                    <textarea
                                                        rows={3}
                                                        value={leadFormData.message || ''}
                                                        onChange={(e) => setLeadFormData({ ...leadFormData, message: e.target.value })}
                                                        style={{ width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem', resize: 'vertical' }}
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={leadSubmitting}
                                                style={{
                                                    width: '100%',
                                                    padding: '1rem',
                                                    background: '#FFD700',
                                                    color: '#000',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontSize: '1rem',
                                                    fontWeight: 900,
                                                    cursor: leadSubmitting ? 'not-allowed' : 'pointer',
                                                    opacity: leadSubmitting ? 0.6 : 1,
                                                    marginTop: '0.5rem'
                                                }}
                                            >
                                                {leadSubmitting ? 'Submitting...' : 'Submit'}
                                            </button>

                                            <p style={{ fontSize: '0.7rem', color: '#52525b', textAlign: 'center', marginTop: '0.5rem' }}>
                                                Your information will be used to contact you about this campaign.
                                            </p>
                                        </form>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>Thank You!</h3>
                                        <p style={{ color: '#71717a', marginBottom: '2rem' }}>We'll be in touch soon.</p>
                                        <button
                                            onClick={() => {
                                                setShowLeadModal(false);
                                                setLeadSubmitted(false);
                                                setLeadFormData({});
                                            }}
                                            style={{
                                                padding: '0.75rem 2rem',
                                                background: 'rgba(255,255,255,0.1)',
                                                color: 'white',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '12px',
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Close
                                        </button>
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
