import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ExternalLink, Clock, Check, X, User, MapPin, Phone, Calendar } from 'lucide-react';
import Head from 'next/head';
import { isAdmin } from '@/lib/admin';

export default function AdminKYC() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await fetchEnrollments();
            markAsRead();
        };
        init();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const res = await fetch('/api/admin/kyc');
            const data = await res.json();
            if (data.success) setEnrollments(data.data);
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    const markAsRead = async () => {
        try {
            await fetch('/api/admin/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'kyc' })
            });
        } catch (err) { console.error(err); }
    };

    const handleAction = async (id, status) => {
        const notes = status === 'rejected' ? prompt('Enter rejection reason:') : '';
        if (status === 'rejected' && notes === null) return;

        try {
            const res = await fetch(`/api/admin/kyc/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reviewNotes: notes })
            });
            if (res.ok) {
                setEnrollments(enrollments.map(e => e._id === id ? { ...e, status } : e));
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div style={{ background: '#050505', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Compliance Queue...</div>;

    return (
        <div style={{ background: '#050505', minHeight: '100vh', color: 'white', padding: '4rem 2rem' }}>
            <Head><title>Compliance Protocol | Adgyapan Admin</title></Head>

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <ShieldCheck className="gold-text" size={24} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.5 }}>Compliance Hub</span>
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>KYC <span className="gold-text">Verifications</span></h1>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900 }}>{enrollments.filter(e => e.status === 'pending').length}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>Waiting Review</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {enrollments.length === 0 && <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.3 }}>No enrollment requests found.</div>}

                    {enrollments.map(e => (
                        <motion.div
                            key={e._id}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '32px',
                                padding: '2.5rem',
                                transition: 'all 0.3s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                        <User size={30} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 4px' }}>{e.legalName}</h3>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', opacity: 0.4, fontWeight: 700 }}>
                                            <span>USER: {e.userId.substring(0, 15)}...</span>
                                            <span>•</span>
                                            <span>SUBMITTED: {new Date(e.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '8px 16px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px',
                                    background: e.status === 'approved' ? 'rgba(16,185,129,0.1)' : e.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: e.status === 'approved' ? '#10b981' : e.status === 'pending' ? '#f59e0b' : '#ef4444'
                                }}>
                                    {e.status}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '2.5rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 900 }}>Identity Document</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{e.idType} ({e.idNumber})</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 900 }}>Contact info</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{e.phone}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 900 }}>Residence</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{e.nationality}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 900 }}>Birth Date</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{new Date(e.dob).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <a href={e.idImageUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '14px', color: '#3b82f6', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem' }}>
                                    EXAMINE ID DOCUMENT <ExternalLink size={16} />
                                </a>

                                {e.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={() => handleAction(e._id, 'rejected')} style={{ padding: '12px 24px', borderRadius: '14px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: 900, cursor: 'pointer' }}>REJECT</button>
                                        <button onClick={() => handleAction(e._id, 'approved')} style={{ padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}>APPROVE USER</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
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
