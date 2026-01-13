
import { motion } from 'framer-motion';
import { Check, Zap, Crown, ShieldCheck, ArrowRight, Clock, Calendar, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function Pricing() {
    const { user } = useUser();
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/subscriptions/me')
            .then(res => res.json())
            .then(data => {
                console.log('Pricing API response:', data);
                if (data.success && data.data) {
                    setSub(data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Use the same logic as dashboard
    const isPro = sub && sub.plan === 'pro' && sub.status === 'active';

    // Calculate days remaining (valid for exactly 365 days from purchase)
    const getDaysRemaining = () => {
        if (!sub) return 0;
        // Use activatedAt if available, otherwise fall back to createdAt
        const purchaseDate = sub.activatedAt || sub.createdAt;
        if (!purchaseDate) return 0;

        const start = new Date(purchaseDate);
        const expiry = new Date(start);
        expiry.setDate(expiry.getDate() + 365); // Valid for exactly 365 days
        const now = new Date();
        const diff = expiry - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const plans = [
        {
            name: 'Starter',
            price: 'Free',
            description: 'Perfect for individual creators testing WebAR.',
            features: ['3 Active Campaigns', 'Basic Analytics', 'Standard AR Target', 'Public Feed Visibility'],
            icon: <Zap size={24} className="text-blue-400" />,
            color: 'rgba(59, 130, 246, 0.1)',
            btnText: 'Current Plan',
            btnLink: '/dashboard',
            disabled: true
        },
        {
            name: 'Pro',
            price: 'NPR 1999',
            period: '/yr',
            description: 'For power users and growing brands.',
            features: [
                'Unlimited Campaigns',
                'Advanced 3D Analytics',
                'Genre Category Tags',
                'Higher Overlay Quality',
                'Priority Verification',
                'Ad-Free Scanning'
            ],
            icon: <Crown size={24} style={{ color: '#f59e0b' }} />,
            color: 'rgba(245, 158, 11, 0.1)',
            recommended: true,
            btnText: 'Upgrade to Pro',
            btnLink: '/checkout?plan=pro'
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'Enterprise-grade AR infrastructure.',
            features: [
                'Everything in Pro',
                'Custom White-labeling',
                'API & Webhook Access',
                'Dedicated Account Manager',
                'Custom MindAR Training'
            ],
            icon: <ShieldCheck size={24} style={{ color: '#10b981' }} />,
            color: 'rgba(16, 185, 129, 0.1)',
            btnText: 'Contact Sales',
            btnLink: 'mailto:contact@adgyapan.com'
        }
    ];

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

    return (
        <div className="container" style={{
            minHeight: '100vh',
            width: '100%',
            maxWidth: '1200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '2rem',
            paddingBottom: '7rem',
            margin: '0 auto',
            overflowX: 'hidden'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '3rem' }}
            >
                <h1 style={{ fontSize: '3.5rem', fontWeight: 1000, marginBottom: '1rem', letterSpacing: '-2px', lineHeight: 1.1 }}>
                    Choose Your <span style={{ color: '#fe2c55' }}>Power</span>.
                </h1>
                <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto' }}>
                    Unlock advanced AR tools, unlimited storytelling, and deeper audience insights.
                </p>
            </motion.div>

            {isPro ? (
                // Active Subscription View
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card"
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        margin: '0 auto',
                        padding: '3rem',
                        textAlign: 'center',
                        border: '1px solid #f59e0b',
                        background: 'rgba(245, 158, 11, 0.05)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Crown size={64} color="#f59e0b" />
                        <BadgeCheck size={48} fill="#f59e0b" color="black" strokeWidth={1.5} />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {user?.firstName || user?.username || 'You'}
                        <span style={{ fontSize: '1.5rem', color: '#f59e0b' }}>✓ PRO</span>
                    </h2>
                    <p style={{ color: '#ccc', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                        Enjoy unlimited campaigns and advanced analytics. Your creative potential is unlocked.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '1rem' }}>
                            <div style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} /> Purchased On
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                                {sub.activatedAt ? new Date(sub.activatedAt).toLocaleDateString() :
                                    sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '1rem' }}>
                            <div style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Clock size={16} /> Days Remaining
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f59e0b' }}>
                                {getDaysRemaining()} Days
                            </div>
                        </div>
                    </div>

                    <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                        Go to Dashboard <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                    </Link>
                </motion.div>
            ) : (
                // Standard Pricing Cards
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', width: '100%' }}>
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card"
                            style={{
                                padding: 'clamp(2.5rem, 5vh, 3rem) clamp(1.5rem, 4vw, 2rem)',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                border: plan.recommended ? '1px solid #fe2c55' : '1px solid rgba(255,255,255,0.1)',
                                background: plan.recommended ? 'rgba(254, 44, 85, 0.03)' : 'rgba(255,255,255,0.02)'
                            }}
                        >
                            {plan.recommended && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#fe2c55',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 1000,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    Most Popular
                                </div>
                            )}

                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: plan.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '2rem'
                            }}>
                                {plan.icon}
                            </div>

                            <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <p style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '2rem', height: '40px' }}>{plan.description}</p>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 1000 }}>{plan.price}</span>
                                {plan.period && <span style={{ color: '#71717a' }}>{plan.period}</span>}
                            </div>

                            <div style={{ flex: 1, marginBottom: '2.5rem' }}>
                                {plan.features.map(feature => (
                                    <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                        <div style={{ color: '#10b981', flexShrink: 0 }}><Check size={18} /></div>
                                        <span style={{ color: '#e4e4e7' }}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={plan.btnLink}
                                className={`btn ${plan.recommended ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    width: '100%',
                                    padding: '1.2rem',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    height: 'auto',
                                    opacity: plan.disabled ? 0.5 : 1,
                                    cursor: plan.disabled ? 'default' : 'pointer'
                                }}
                            >
                                {plan.btnText}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '5rem', textAlign: 'center' }}>
                <p style={{ color: '#71717a' }}>All plans include core AR geometry and basic social interactions.</p>
            </div>
        </div>
    );
}
