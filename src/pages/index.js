import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth, UserButton, SignUpButton, SignInButton } from '@clerk/nextjs';
import { ArrowRight, ScanLine, Smartphone, Zap, Play, LayoutGrid, Compass, ShieldCheck, Globe, Users, TrendingUp, CheckCircle2, Layers } from 'lucide-react';
import dynamic from 'next/dynamic';
import PricingSection from '@/components/PricingSection';
import TiltCard from '@/components/TiltCard';

const Background3D = dynamic(() => import('@/components/Background3D'), { ssr: false });

export default function LandingPage() {
    const { isSignedIn } = useAuth();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20;
        const y = (clientY / window.innerHeight - 0.5) * 20;
        setMousePos({ x, y });
    };

    return (
        <div style={{ overflowX: 'hidden' }} onMouseMove={handleMouseMove}>
            <Head>
                <title>Adgyapan - The Future of AR Advertising</title>
                <meta name="description" content="Turn physical ads into immersive AR experiences." />
            </Head>

            {/* Live Activity Ticker */}
            <div style={{ background: '#FFD700', color: '#000', padding: '0.5rem 0', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', zIndex: 100 }}>
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'flex', gap: '4rem', width: 'max-content' }}
                >
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <span>● New scan in Kathmandu</span>
                            <span>● Campaign launched in Real Estate</span>
                            <span>● Pro subscription activated in London</span>
                            <span>● 500+ Scans in Retail this hour</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Hero Section */}
            <section style={{
                minHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '4rem 2rem',
                position: 'relative',
                background: 'radial-gradient(circle at center, rgba(121, 40, 202, 0.1) 0%, transparent 70%)'
            }}>
                {/* 3D Background */}
                <Background3D />

                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '900px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div style={{
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '100px',
                            background: 'rgba(255, 215, 0, 0.1)',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            color: '#FFD700',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            letterSpacing: '1px',
                            marginBottom: '2rem',
                            textTransform: 'uppercase'
                        }}>
                            From Print to Profit
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                            fontWeight: 900,
                            lineHeight: 1,
                            marginBottom: '1.5rem',
                            letterSpacing: '-2px'
                        }}>
                            Turn Static Ads Into <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Sales Machines.</span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                            color: '#a1a1aa',
                            marginBottom: '3.5rem',
                            lineHeight: 1.6,
                            maxWidth: '700px',
                            margin: '0 auto 3.5rem auto'
                        }}
                    >
                        Don't let your flyers end up in the trash. Adgyapan transforms boring print marketing into interactive 3D experiences that <b>capture leads</b> and <b>drive real revenue</b>.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}
                    >
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {isSignedIn ? (
                                <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 20px 40px rgba(255, 215, 0, 0.2)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    Enter Control Center <ArrowRight size={20} />
                                </Link>
                            ) : (
                                <SignUpButton mode="modal">
                                    <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 20px 40px rgba(255, 215, 0, 0.2)', display: 'flex', alignItems: 'center', gap: '0.8rem', border: 'none', cursor: 'pointer' }}>
                                        Launch Campaign <ArrowRight size={20} />
                                    </button>
                                </SignUpButton>
                            )}


                            <Link href="/lead-capture" style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                textDecoration: 'none',
                                fontWeight: '600',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s ease'
                            }}>
                                Book Demo
                            </Link>
                        </div>

                        <Link href="/gallery" style={{
                            fontSize: '1rem',
                            color: '#a1a1aa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            textDecoration: 'none',
                            fontWeight: '500',
                            opacity: 0.8,
                            transition: 'opacity 0.2s',
                            borderBottom: '1px solid transparent'
                        }}
                            onMouseEnter={(e) => e.target.style.opacity = '1'}
                            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                        >
                            <Compass size={18} /> Discover global exhibits in the gallery
                        </Link>
                    </motion.div>
                </div>

                {/* Feed Preview Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{
                        marginTop: '8rem',
                        width: '100%',
                        maxWidth: '1200px',
                        padding: 'clamp(2rem, 5vw, 3rem)',
                        background: 'rgba(255,255,255,0.01)',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(30px)',
                        textAlign: 'left',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '3rem'
                    }}
                >
                    <div style={{ flex: '1 1 300px', zIndex: 2 }}>
                        <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Live Ecosystem</div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-1px' }}>The Global Ad Feed.</h2>
                        <p style={{ color: '#a1a1aa', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '500px' }}>
                            See how businesses around the world are redefining reality. Explore live campaigns, engagement heatmaps, and creative dimensions.
                        </p>
                        <Link href="/feed" className="btn btn-secondary" style={{ width: 'fit-content', padding: '1rem 2rem' }}>
                            Browse Live Feed <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </Link>
                    </div>

                    <div style={{ flex: '1 1 300px', height: '250px', position: 'relative', display: 'flex', justifyContent: 'center', minWidth: '280px' }}>
                        {/* Abstract Feed Representation */}
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                animate={{
                                    y: [0, -20, 0],
                                    rotate: [i * 5, i * 5 + 2, i * 5]
                                }}
                                transition={{ duration: 4, delay: i * 0.5, repeat: Infinity }}
                                style={{
                                    width: '180px',
                                    height: '140px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,215,0,0.1)',
                                    position: 'absolute',
                                    left: `${20 + i * 40}px`,
                                    top: `${i * 30}px`,
                                    zIndex: 3 - i,
                                    backdropFilter: 'blur(5px)'
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Trust Badges / Social Proof Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    style={{
                        marginTop: '6rem',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 'clamp(1.5rem, 5vw, 4rem)',
                        flexWrap: 'wrap',
                        opacity: 0.4,
                        padding: '0 2rem'
                    }}
                >
                    {[
                        { icon: <ShieldCheck size={18} />, text: 'Enterprise Secure' },
                        { icon: <Zap size={18} />, text: 'High-Speed AR' },
                        { icon: <Globe size={18} />, text: 'Global Delivery' },
                        { icon: <CheckCircle2 size={18} />, text: '100% Web-Based' }
                    ].map((badge, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            {badge.icon} {badge.text}
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Industry Templates Section */}
            <section style={{ padding: '10rem 2rem', position: 'relative' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        style={{ marginBottom: '6rem' }}
                    >
                        <div style={{ color: '#FFD700', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '1.25rem', letterSpacing: '3px' }}>The Blueprints</div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-3px', lineHeight: 1 }}>Industry-Ready <br /> <span style={{ opacity: 0.5 }}>Architectures.</span></h2>
                        <p style={{ color: '#71717a', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
                            Eliminate the blank canvas. Our pre-calibrated spatial blue-prints
                            allow you to deploy specialized AR mechanics in seconds.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
                        {[
                            { title: "Hospitality & Dining", desc: "Digital menus that float with depth, showcasing real-time inventory and chef specials.", icon: <Layers size={28} /> },
                            { title: "Real Estate Portals", desc: "For-sale signs become immersive portals to high-fidelity 3D property walkthroughs.", icon: <Compass size={28} /> },
                            { title: "Retail & Fashion", desc: "Virtual catwalks and digital product layers that exist in physical shopping spaces.", icon: <Zap size={28} /> }
                        ].map((box, i) => (
                            <TiltCard key={i}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        padding: '4rem 2.5rem',
                                        textAlign: 'left',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255, 215, 0, 0.05)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        height: '100%'
                                    }}
                                >
                                    <div style={{
                                        width: '60px', height: '60px', borderRadius: '16px',
                                        background: 'rgba(255, 215, 0, 0.03)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', marginBottom: '2rem',
                                        color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.1)'
                                    }}>{box.icon}</div>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-1px' }}>{box.title}</h3>
                                    <p style={{ color: '#71717a', lineHeight: 1.7, fontSize: '1rem', fontWeight: 500 }}>{box.desc}</p>
                                </motion.div>
                            </TiltCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Success Metrics / ROI Section */}
            <section style={{ padding: '10rem 2rem', background: '#050505' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem' }}>
                        {[
                            { val: '300%', label: 'Higher Engagement', desc: 'compared to static traditional benchmarks.', icon: <TrendingUp size={24} color="#10b981" /> },
                            { val: '12s+', label: 'Avg. Screen Time', desc: 'deep brand immersion and storytelling.', icon: <Zap size={24} color="#FFD700" /> },
                            { val: '50k+', label: 'Scans Monthly', desc: 'growing network of physical discovery.', icon: <Users size={24} color="#3b82f6" /> }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                    <div style={{ padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>{stat.icon}</div>
                                </div>
                                <div style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-2px', fontFamily: 'monospace' }}>{stat.val}</div>
                                <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', marginBottom: '0.75rem', color: '#fff' }}>{stat.label}</div>
                                <p style={{ color: '#52525b', fontSize: '0.95rem', lineHeight: 1.6 }}>{stat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* How It Works Section */}
            <section style={{ padding: '10rem 2rem', background: 'var(--secondary)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                        <div style={{ color: '#FFD700', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '1.25rem', letterSpacing: '3px' }}>The Core Mechanism</div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, letterSpacing: '-3px' }}>Frictionless <span style={{ opacity: 0.5 }}>Discovery.</span></h2>
                    </div>

                    <div className="how-it-works-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '6rem',
                    }}>
                        {[
                            { icon: <ScanLine size={40} color="#FFD700" />, title: "1. Capture", desc: "User scans a custom-branded QR code on any static surface." },
                            { icon: <Smartphone size={40} color="#FFD700" />, title: "2. Activate", desc: "The physical world unlocks into a high-fidelity 3D layer." },
                            { icon: <Zap size={40} color="#FFD700" />, title: "3. Convert", desc: "Integrated spatial CTAs drive instant brand action." }
                        ].map((step, i) => (
                            <TiltCard key={i}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}
                                >
                                    <div style={{
                                        width: '100px', height: '100px', borderRadius: '32px',
                                        background: 'rgba(255,215,0,0.02)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem',
                                        border: '1px solid rgba(255,215,0,0.1)'
                                    }}>
                                        {step.icon}
                                    </div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-1px' }}>{step.title}</h3>
                                    <p style={{ color: '#71717a', lineHeight: 1.7, fontSize: '1.1rem', fontWeight: 500 }}>{step.desc}</p>
                                </motion.div>
                            </TiltCard>
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ padding: '5rem 2rem' }}>
                <PricingSection showTitle={true} />
            </section>

            {/* Professional Footer */}
            <footer style={{ background: '#050505', padding: '5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem' }}>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem', letterSpacing: '-1px' }}>ADGYAPAN</div>
                        <p style={{ color: '#52525b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                            Our mission is to bridge the gap between physical reality and digital storytelling, empowering businesses to create magic in the real world.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', color: '#fff' }}>Ecosystem</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Link href="/gallery" style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem' }}>Discovery Gallery</Link>
                            <Link href="/feed" style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem' }}>Live Feed</Link>
                            <Link href="/how-it-works" style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem' }}>The Technology</Link>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', color: '#fff' }}>Company</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Link href="/pricing" style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing & Plans</Link>
                            <Link href="/contact" style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem' }}>Enterprise Inquiry</Link>
                            <Link href="/legal" style={{ color: '#52525b', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</Link>
                        </div>
                    </div>
                </div>
                <div style={{ maxWidth: '1200px', margin: '4rem auto 0', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                    <p style={{ color: '#3f3f46', fontSize: '0.75rem', fontWeight: 600 }}>
                        © 2026 Adgyapan AR. Built with Precision. Secure and Performance Guaranteed.
                    </p>
                </div>
            </footer>
        </div>
    );
}
