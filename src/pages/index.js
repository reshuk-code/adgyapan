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
            <section style={{ padding: '8rem 2rem', background: 'var(--secondary)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '4rem' }}>How It Works</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        {[
                            { icon: <ScanLine size={40} color="#ff0080" />, title: "1. Scan QR", desc: "Users scan the QR code on your physical ad using their phone camera." },
                            { icon: <Smartphone size={40} color="#7928ca" />, title: "2. Experience AR", desc: "A high-quality 3D video or interactive engagement instantly overlays on the real world." },
                            { icon: <Zap size={40} color="#0070f3" />, title: "3. Convert", desc: "Direct users to your website, store, or profile with a single tap after the experience." }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                style={{
                                    background: 'var(--input)',
                                    padding: '2.5rem',
                                    borderRadius: '1.5rem',
                                    border: '1px solid var(--border)',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', width: 'fit-content', padding: '1rem', borderRadius: '1rem' }}>{step.icon}</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>{step.title}</h3>
                                <p style={{ color: '#888', lineHeight: 1.6 }}>{step.desc}</p>
                            </motion.div>
                        ))}
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
