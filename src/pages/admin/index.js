import { motion } from 'framer-motion';
import Link from 'next/link';
import Head from 'next/head';
import { Wallet, ShieldCheck, CreditCard, LayoutDashboard, ChevronRight } from 'lucide-react';
import { isAdmin } from '@/lib/admin';

export default function AdminDashboard() {
    const tools = [
        {
            title: 'Vault Verification',
            desc: 'Review and approve wallet top-up requests.',
            icon: <Wallet size={24} />,
            link: '/admin/wallet',
            color: '#FFD700'
        },
        {
            title: 'KYC & Compliance',
            desc: 'Verify user identities for marketplace access.',
            icon: <ShieldCheck size={24} />,
            link: '/admin/kyc',
            color: '#10b981'
        },
        {
            title: 'Plan Subscriptions',
            desc: 'Manage Pro and Enterprise tier payments.',
            icon: <CreditCard size={24} />,
            link: '/admin/subscriptions',
            color: '#3b82f6'
        }
    ];

    return (
        <div style={{ background: '#050505', minHeight: '100vh', color: 'white', padding: '4rem 2rem' }}>
            <Head><title>Admin Console | Adgyapan</title></Head>

            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <LayoutDashboard className="gold-text" size={24} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.5 }}>Command Center</span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>Admin <span className="gold-text">Protocols</span></h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {tools.map((tool, i) => (
                        <Link href={tool.link} key={i} style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={{ x: 10, background: 'rgba(255,255,255,0.04)' }}
                                style={{
                                    padding: '2.5rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '20px',
                                    background: `${tool.color}15`, color: tool.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {tool.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: 'white' }}>{tool.title}</h3>
                                    <p style={{ margin: 0, opacity: 0.4, fontSize: '0.9rem' }}>{tool.desc}</p>
                                </div>
                                <ChevronRight size={20} opacity={0.3} />
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .gold-text {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    );
}

export async function getServerSideProps(context) {
    const isUserAdmin = await isAdmin(context.req);
    if (!isUserAdmin) {
        return { redirect: { destination: '/pricing', permanent: false } };
    }
    return { props: {} };
}
