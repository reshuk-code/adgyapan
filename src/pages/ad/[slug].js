
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import { motion } from 'framer-motion';

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
                        mindar-image={`imageTargetSrc: ${ad.targetUrl}; filterMinCF:0.0001; filterBeta: 0.001;`}
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
                            ></video>
                        </a-assets>

                        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

                        <a-entity
                            mindar-image-target="targetIndex: 0"
                            ref={entity => {
                                if (entity) {
                                    entity.addEventListener("targetFound", () => {
                                        const v = document.querySelector('#vid');
                                        if (v) v.play();
                                        setShowCta(true);
                                    });
                                    entity.addEventListener("targetLost", () => {
                                        const v = document.querySelector('#vid');
                                        if (v) v.pause();
                                        setShowCta(false);
                                    });
                                }
                            }}
                        >
                            <a-plane
                                src="#vid"
                                position={`${overlay.positionX || 0} ${overlay.positionY || 0} 0`}
                                height="0.552"
                                width="1"
                                rotation={`0 0 ${overlay.rotation || 0}`}
                                scale={`${overlay.scale || 1} ${overlay.scale || 1} 1`}
                                opacity={overlay.opacity || 1}
                                className="clickable"
                                onClick={() => {
                                    const v = document.querySelector('#vid');
                                    if (v) { v.play(); v.muted = false; }
                                }}
                            ></a-plane>
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

                {/* AR CTA Button (Pro Only) */}
                {showCta && ad.ctaText && ad.userPlan === 'pro' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: '100px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1001,
                            width: 'auto'
                        }}
                    >
                        <a
                            href={ensureAbsoluteUrl(ad.ctaUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                fetch('/api/track', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ slug: ad.slug, type: 'click' })
                                });
                            }}
                            style={{
                                display: 'block',
                                padding: '12px 30px',
                                background: 'linear-gradient(135deg, #fe2c55 0%, #ff4b2b 100%)',
                                color: 'white',
                                borderRadius: '30px',
                                fontWeight: '900',
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontSize: '0.9rem',
                                boxShadow: '0 10px 30px rgba(254, 44, 85, 0.5)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {ad.ctaText}
                        </a>
                    </motion.div>
                )}

                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '0',
                    width: '100%',
                    textAlign: 'center',
                    zIndex: 1000,
                    pointerEvents: 'none'
                }}>
                    <button style={{
                        pointerEvents: 'auto',
                        padding: '10px 20px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                    }} onClick={() => {
                        const v = document.querySelector('#vid');
                        if (v) {
                            v.play();
                            v.muted = false;
                        }
                    }}>
                        Tap to Play Video
                    </button>
                </div>
            </div>
        </>
    );
}
