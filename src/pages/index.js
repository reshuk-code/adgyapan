import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth, UserButton } from '@clerk/nextjs';
import { ArrowRight, ScanLine, Smartphone, Zap, Play } from 'lucide-react';
import dynamic from 'next/dynamic';
import PricingSection from '@/components/PricingSection';

const Background3D = dynamic(() => import('@/components/Background3D'), { ssr: false });

export default function LandingPage() {
    const { isSignedIn } = useAuth();

    return (
        <div style={{ overflowX: 'hidden' }}>
            <Head>
                <title>Adgyapan - The Future of AR Advertising</title>
                <meta name="description" content="Turn physical ads into immersive AR experiences." />
            </Head>

            {/* Hero Section */}
            <section style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem',
                position: 'relative'
            }}>
                {/* 3D Background */}
                <Background3D />

                <div style={{ maxWidth: '800px', zIndex: 10, position: 'relative' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div style={{
                            background: 'linear-gradient(90deg, #ff0080, #7928ca)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '900',
                            fontSize: '1rem',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            marginBottom: '1rem'
                        }}>
                            Augmented Reality Ads
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: '900', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-2px' }}
                    >
                        Make Your Ads <br /> <span style={{ color: '#fff' }}>Come Alive.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        style={{ fontSize: '1.2rem', color: '#888', marginBottom: '2.5rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 2.5rem' }}
                    >
                        Join the revolution. Turn boring static billboards and posters into interactive 3D experiences just by scanning a QR code.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        {isSignedIn ? (
                            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '2rem' }}>
                                Launch Campaign <ArrowRight size={20} />
                            </Link>
                        ) : (
                            <Link href="/sign-up" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '2rem' }}>
                                Get Started <ArrowRight size={20} />
                            </Link>
                        )}
                        <Link href="/feed" style={{
                            padding: '1rem 2.5rem',
                            fontSize: '1.1rem',
                            borderRadius: '2rem',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none',
                            fontWeight: '600',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <Play size={20} fill="white" /> Watch Demo
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ padding: 'clamp(4rem, 8vh, 8rem) 2rem', background: 'var(--secondary)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '4rem' }}>How It Works</h2>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2rem',
                        position: 'relative'
                    }}>
                        {/* Desktop Connector Line (Optional, simplified to individual arrows for responsiveness) */}
                        <div className="how-it-works-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '4rem',
                            // alignItems: 'stretch' is default, ensures equal height
                        }}>
                            {[
                                { icon: <ScanLine size={32} color="#ff0080" />, title: "1. Scan QR", desc: "Just point your camera. No app download needed." },
                                { icon: <Smartphone size={32} color="#7928ca" />, title: "2. Experience", desc: "Watch the ad come to life in 3D right on your screen." },
                                { icon: <Zap size={32} color="#0070f3" />, title: "3. Take Action", desc: "One tap to visit the site, buy, or follow." }
                            ].map((step, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.2, duration: 0.5 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '2rem',
                                            borderRadius: '1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            width: '100%',
                                            height: '100%', // Ensure card fills container for equal height
                                            position: 'relative',
                                            zIndex: 2
                                        }}
                                    >
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 0 20px rgba(0,0,0,0.2)'
                                        }}>
                                            {step.icon}
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>{step.title}</h3>
                                        <p style={{ color: '#a1a1aa', lineHeight: 1.5, fontSize: '0.95rem' }}>{step.desc}</p>
                                    </motion.div>

                                    {/* Connector Arrow (Show for first two items) */}
                                    {i < 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + (i * 0.2) }}
                                            className="desktop-arrow"
                                            style={{
                                                position: 'absolute',
                                                right: '-2.5rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 1,
                                                color: 'rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            <ArrowRight size={32} />
                                        </motion.div>
                                    )}
                                    {i < 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + (i * 0.2) }}
                                            className="mobile-arrow"
                                            style={{
                                                marginTop: '1rem',
                                                color: 'rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            <ArrowRight size={24} style={{ transform: 'rotate(90deg)' }} />
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Full Pricing Section - Hidden for Pro Users */}
            <section style={{ padding: '5rem 2rem' }}>
                <PricingSection showTitle={true} />
            </section>
        </div>
    );
}
