
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Cpu, Zap, ScanLine, Layers, ArrowLeft, Smartphone, Code2, Globe2 } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorks() {
    const techSteps = [
        {
            title: "1. Spatial Induction",
            icon: <ScanLine className="gold-text" size={32} />,
            desc: "Our computer vision engine (MindAR) scans the environment via the browser camera, identifying high-contrast geometry markers in real-time."
        },
        {
            title: "2. Coordinate Mapping",
            icon: <Cpu className="gold-text" size={32} />,
            desc: "The system calculates the six-degree-of-freedom (6DoF) pose of the device relative to the target, creating a stable mathematical anchor for digital objects."
        },
        {
            title: "3. Low-Latency Pipeline",
            icon: <Zap className="gold-text" size={32} />,
            desc: "Web-assembly (WASM) acceleration ensures that frame processing and overlay projection happen at 60FPS directly in the web browser—no app required."
        },
        {
            title: "4. Cloud Delivery",
            icon: <Globe2 className="gold-text" size={32} />,
            desc: "High-quality video and 3D assets are delivered via a global edge network, optimized for mobile bandwidth and instant loading."
        }
    ];

    return (
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
            <Head>
                <title>The Technology - Adgyapan</title>
            </Head>

            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#52525b', textDecoration: 'none', marginBottom: '3rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Command Center
            </Link>

            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: '8rem' }}
                >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '1.5rem' }}>
                        <Code2 size={16} color="#3b82f6" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#3b82f6' }}>The Spatial Stack</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(3.5rem, 8vw, 5rem)', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-3px' }}>Web Native <br /><span className="gold-text">Immersive Engineering.</span></h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.3rem', lineHeight: 1.6 }}>
                        We've removed the greatest barrier to AR: Friction. No apps, no downloads, just standard web technology pushed to its absolute limit.
                    </p>
                </motion.header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4rem' }}>
                    {techSteps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, auto) 1fr', gap: '3rem', alignItems: 'start' }}
                        >
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {step.icon}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>{step.title}</h3>
                                <p style={{ color: '#a1a1aa', fontSize: '1.1rem', lineHeight: 1.7 }}>{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Performance Comparison */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    style={{ marginTop: '10rem', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '4rem' }}>Optimized for Speed</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
                        <div>
                            <Smartphone size={32} color="#10b981" style={{ marginBottom: '1.5rem' }} />
                            <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>3.2s</div>
                            <p style={{ fontSize: '0.85rem', color: '#52525b', textTransform: 'uppercase', fontWeight: 800 }}>Average Load Time</p>
                        </div>
                        <div>
                            <Layers size={32} color="#3b82f6" style={{ marginBottom: '1.5rem' }} />
                            <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>60 FPS</div>
                            <p style={{ fontSize: '0.85rem', color: '#52525b', textTransform: 'uppercase', fontWeight: 800 }}>Tracking Frame Rate</p>
                        </div>
                        <div>
                            <Globe2 size={32} color="#FFD700" style={{ marginBottom: '1.5rem' }} />
                            <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>99.9%</div>
                            <p style={{ fontSize: '0.85rem', color: '#52525b', textTransform: 'uppercase', fontWeight: 800 }}>Edge Cache Availability</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
