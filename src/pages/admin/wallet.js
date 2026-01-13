
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ExternalLink, Wallet, Clock, AlertCircle } from 'lucide-react';
import Head from 'next/head';

export default function AdminWallet() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/admin/wallet-transactions');
            const data = await res.json();
            if (data.success) setTransactions(data.data);
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    const handleAction = async (id, status) => {
        try {
            const res = await fetch(`/api/admin/wallet-transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setTransactions(transactions.map(t => t._id === id ? { ...t, status } : t));
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div style={{ background: '#050505', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Initializing Vault Admin...</div>;

    return (
        <div style={{ background: '#050505', minHeight: '100vh', color: 'white', padding: '4rem 2rem' }}>
            <Head><title>Vault Verification | Admin</title></Head>

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <Wallet className="gold-text" size={24} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.5 }}>Financial Protocol</span>
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>Vault <span className="gold-text">Top-Ups</span></h1>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900 }}>{transactions.filter(t => t.status === 'pending').length}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>Pending Approvals</div>
                    </div>
                </div>

                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Request ID / User</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Credit Amount</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Proof</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', opacity: 0.3, fontWeight: 700 }}>No top-up requests found in the ledger.</td>
                                </tr>
                            )}
                            {transactions.map(t => (
                                <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.3s' }} className="table-row">
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>{t._id.substring(t._id.length - 8).toUpperCase()}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{t.userId}</div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div className="gold-text" style={{ fontWeight: 900, fontSize: '1.1rem' }}>Rs {t.amount.toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <a href={t.paymentProof} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>
                                            VIEW STATEMENT <ExternalLink size={14} />
                                        </a>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900,
                                            background: t.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : t.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: t.status === 'approved' ? '#10b981' : t.status === 'pending' ? '#f59e0b' : '#ef4444',
                                            textTransform: 'uppercase', letterSpacing: '1px'
                                        }}>
                                            {t.status === 'pending' && <Clock size={12} />}
                                            {t.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        {t.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => handleAction(t._id, 'completed')} style={{ background: '#10b981', color: 'black', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.7rem' }}>APPROVE</button>
                                                <button onClick={() => handleAction(t._id, 'rejected')} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.7rem' }}>REJECT</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    color: (t.status === 'completed' || t.status === 'approved') ? '#10b981' : '#ef4444',
                                                    background: (t.status === 'completed' || t.status === 'approved') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px'
                                                }}>
                                                    {t.status === 'completed' || t.status === 'approved' ? 'CREDITED' : t.status.toUpperCase()}
                                                </span>
                                                <button onClick={() => handleAction(t._id, 'completed')} style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.6rem' }}>RE-CREDIT</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .glass-card {
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                }
                .table-row:hover {
                    background: rgba(255,255,255,0.01);
                }
                .gold-text {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    );
}
import { isAdmin } from '@/lib/admin';

export async function getServerSideProps(context) {
    const isUserAdmin = await isAdmin(context.req);

    if (!isUserAdmin) {
        return {
            redirect: {
                destination: '/pricing',
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
}
