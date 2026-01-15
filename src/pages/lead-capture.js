import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeadCapture() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadData: formData,
                    source: 'website'
                })
            });

            const data = await res.json();

            if (data.success) {
                setSubmitted(true);
                toast.success("We've received your inquiry! We'll be in touch shortly.");
            } else {
                toast.error(data.error || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to submit form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            background: 'radial-gradient(circle at top right, rgba(121, 40, 202, 0.05) 0%, transparent 40%)'
        }}>
            <Head>
                <title>Contact Adgyapan - Transform Your Advertising</title>
                <meta name="description" content="Request a demo and start your AR advertising journey." />
            </Head>

            <div style={{ maxWidth: '1000px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>

                {/* Left Column: Copy */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{ color: '#FFD700', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '1.5rem', letterSpacing: '3px' }}>
                        Start Your Journey
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-2px' }}>
                        Ready to <br />
                        <span style={{ color: '#a1a1aa' }}>Go Spatial?</span>
                    </h1>
                    <p style={{ color: '#a1a1aa', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        Join the businesses redefining engagement with Adgyapan's AR platform. Get a personalized demo and see how you can increase conversion by 300%.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                            "Full platform walkthrough",
                            "Custom implementation strategy",
                            "Pricing and ROI analysis"
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem', fontWeight: 500 }}>
                                <div style={{ background: 'rgba(255,215,0,0.1)', padding: '0.5rem', borderRadius: '50%', color: '#FFD700' }}>
                                    <CheckCircle2 size={18} />
                                </div>
                                {item}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Column: Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        padding: '3rem',
                        backdropFilter: 'blur(20px)'
                    }}
                >
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <div style={{
                                width: '80px', height: '80px', background: 'rgba(0, 255, 136, 0.1)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 2rem', color: '#00ff88'
                            }}>
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Request Received!</h3>
                            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                                Thanks for your interest, {formData.name}.<br />
                                Our team will contact you at {formData.email} shortly.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#d4d4d8' }}>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                        color: 'white', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#d4d4d8' }}>Work Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="john@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                        color: 'white', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#d4d4d8' }}>Company Name</label>
                                <input
                                    type="text"
                                    name="company"
                                    placeholder="Acme Corp"
                                    value={formData.company}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                        color: 'white', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#d4d4d8' }}>Message (Optional)</label>
                                <textarea
                                    name="message"
                                    rows="3"
                                    placeholder="Tell us about your needs..."
                                    value={formData.message}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                        color: 'white', fontSize: '1rem', resize: 'vertical', outline: 'none'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    marginTop: '1rem',
                                    padding: '1.2rem',
                                    background: '#FFD700',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.8rem',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                {loading ? 'Sending...' : 'Request Demo'}
                            </button>

                            <div style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', marginTop: '1rem' }}>
                                We respect your privacy. No spam, ever.
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
