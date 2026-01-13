import { motion } from 'framer-motion';
import { Check, Zap, Crown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function PricingSection({ showTitle = true }) {
    const { isSignedIn } = useAuth();
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSignedIn) {
            setLoading(false);
            return;
        }

        fetch('/api/subscriptions/me')
            .then(res => res.json())
            .then(data => {
                console.log('PricingSection API response:', data);
                if (data.success && data.data) {
                    setSub(data.data);
                }
            })
            .catch(err => console.error('Error fetching subscription:', err))
            .finally(() => setLoading(false));
    }, [isSignedIn]);

    // Use the same logic as dashboard: sub.plan === 'pro' && sub.status === 'active'
    const isPro = sub && sub.plan === 'pro' && sub.status === 'active';

    console.log('PricingSection - isPro:', isPro, 'sub:', sub);

    // Don't show pricing if user is already Pro
    if (isPro) {
        console.log('Hiding pricing section for Pro user');
        return null;
    }
    if (loading) return null;

    const plans = [
        {
            name: 'Starter',
            price: 'Free',
            description: 'Essential AR tools for hobbyists and explorers.',
            features: [
                '3 Active AR Campaigns',
                'Core Engagement Stats',
                'Community Support',
                'Standard Model Rendering',
                'Social Feed Inclusion'
            ],
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
            description: 'Power tools for creators and growing brands.',
            features: [
                'Unlimited AR Campaigns',
                'Deep Geospatial Analytics',
                'Retention & Attention Stats',
                'Custom Interactive CTAs',
                'Golden Verified Badge',
                'No Branding Watermark',
                'Priority Verification'
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
            description: 'Scale your AR presence globally.',
            features: [
                'Everything in Pro',
                'Custom Marker Training',
                'No Branding Watermark',
                'Managed Campaign Setup',
                'Dedicated Support',
                'Team Workspace Access',
                'Bulk verification'
            ],
            icon: <ShieldCheck size={24} style={{ color: '#10b981' }} />,
            color: 'rgba(16, 185, 129, 0.1)',
            btnText: 'Contact Sales',
            btnLink: 'mailto:contact@adgyapan.com'
        }
    ];

    return (
        <div className="container" style={{
            paddingBottom: '5rem',
            maxWidth: '1200px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
        }}>
            {showTitle && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '4rem' }}
                >
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-2px' }}>
                        Choose Your <span style={{ color: '#fe2c55' }}>Power</span>.
                    </h2>
                    <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto' }}>
                        Unlock advanced AR tools, unlimited storytelling, and deeper audience insights.
                    </p>
                </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', width: '100%' }}>
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
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

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#71717a' }}>All plans include core AR geometry and basic social interactions.</p>
            </div>
        </div>
    );
}
