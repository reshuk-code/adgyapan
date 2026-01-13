
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LegalPage() {
    const sections = [
        {
            title: "Camera & Sensory Data",
            icon: <Eye size={24} className="gold-text" />,
            content: "Adgyapan requires camera access to overlay AR content in your physical space. We do not store, record, or transmit raw camera feeds. The AR processing happens locally on your device's browser."
        },
        {
            title: "Data Privacy",
            icon: <Lock size={24} className="gold-text" />,
            content: "We collect anonymized session metrics (scans, duration, clicks) and generalized geographic data (City/Country) via IP address for campaign analytics. We do not sell your personal data to third parties."
        },
        {
            title: "User Control",
            icon: <Shield size={24} className="gold-text" />,
            content: "Users have full control over their camera permissions. You can revoke access at any time through your browser settings. We are committed to transparency in how we handle immersive technology data."
        },
        {
            title: "Terms of Service",
            icon: <FileText size={24} className="gold-text" />,
            content: "By using Adgyapan, you agree not to create content that is illegal, harmful, or infringes on intellectual property. We reserve the right to suspend accounts that violate our community safety standards."
        }
    ];

    return (
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem', maxWidth: '800px' }}>
            <Head>
                <title>Legal & Privacy - Adgyapan</title>
            </Head>

            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#52525b', textDecoration: 'none', marginBottom: '3rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Return to Home
            </Link>

            <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '5rem' }}
            >
                <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-2px' }}>Legal Foundation</h1>
                <p style={{ color: '#a1a1aa', fontSize: '1.2rem', lineHeight: 1.6 }}>
                    At Adgyapan, we believe trust is the cornerstone of augmented reality. Our policies are designed to be transparent, human-readable, and performance-first.
                </p>
            </motion.header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {sections.map((sec, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        style={{ borderLeft: '2px solid rgba(255, 215, 0, 0.2)', paddingLeft: '2.5rem', position: 'relative' }}
                    >
                        <div style={{ position: 'absolute', left: '-13px', top: '0', background: '#000', padding: '4px' }}>
                            {sec.icon}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{sec.title}</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: 1.7 }}>{sec.content}</p>
                    </motion.div>
                ))}
            </div>

            <footer style={{ marginTop: '8rem', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', textAlign: 'center' }}>
                <p style={{ color: '#52525b', fontSize: '0.9rem' }}>
                    Questions? Reach out to our safety board at <span className="gold-text">legal@adgyapan.com</span>
                    <br /><br />
                    Last Updated: January 2026
                </p>
            </footer>
        </div>
    );
}
