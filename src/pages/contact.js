
import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Send, Building2, Globe2, MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
    const [status, setStatus] = useState('idle'); // idle, sending, success

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('sending');
        // Simulate API call
        setTimeout(() => setStatus('success'), 1500);
    };

    if (status === 'success') {
        return (
            <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card"
                    style={{ padding: '4rem', textAlign: 'center', maxWidth: '500px' }}
                >
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 2rem' }}>
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Inquiry Received</h2>
                    <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        Thank you for reaching out. Our enterprise strategy team will contact you within 24 hours to discuss your custom AR requirements.
                    </p>
                    <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>Return to Command Center</Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
            <Head>
                <title>Enterprise Inquiry - Adgyapan</title>
            </Head>

            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#52525b', textDecoration: 'none', marginBottom: '3rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Return Home
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ color: '#FFD700', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>For High Volume Brands</div>
                    <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-3px', lineHeight: 1 }}>Enterprise <br /><span className="gold-text">Excellence.</span></h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '3rem' }}>
                        Deploy AR experiences at scale. Custom white-label solutions, unlimited bandwidth, and dedicated spatial engineering support for global institutions.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {[
                            { icon: <Building2 className="gold-text" />, title: "Custom Deployment", desc: "Tailored infrastructure for your specific industry." },
                            { icon: <Globe2 className="gold-text" />, title: "Global CDN", desc: "Ultra-low latency AR delivery in 180+ regions." },
                            { icon: <MessageSquare className="gold-text" />, title: "24/7 Support", desc: "Direct line to our spatial computing engineers." }
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
                                <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>{item.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{item.title}</div>
                                    <div style={{ color: '#52525b', fontSize: '0.85rem' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '3rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2.5rem' }}>Request Access</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="label">Full Name</label>
                            <input type="text" className="input" placeholder="Alex Chen" required />
                        </div>
                        <div className="form-group">
                            <label className="label">Work Email</label>
                            <input type="email" className="input" placeholder="alex@company.com" required />
                        </div>
                        <div className="form-group">
                            <label className="label">Organization</label>
                            <input type="text" className="input" placeholder="Global Retail Corp" required />
                        </div>
                        <div className="form-group">
                            <label className="label">Estimated Monthly Scans</label>
                            <select className="input" style={{ background: '#0a0a0a' }}>
                                <option>10,000 - 50,000</option>
                                <option>50,000 - 250,000</option>
                                <option>250,000 - 1M+</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Message</label>
                            <textarea className="input" rows="4" placeholder="Tell us about your spatial vision..." style={{ resize: 'none' }}></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '4rem', marginTop: '1rem' }} disabled={status === 'sending'}>
                            {status === 'sending' ? 'Transmitting Inbound...' : 'Secure Inquiry Transmission'} <Send size={18} style={{ marginLeft: '10px' }} />
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
