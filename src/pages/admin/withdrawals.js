
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ExternalLink, Wallet, Clock, AlertCircle, MessageSquare, Send, User, CreditCard } from 'lucide-react';
import Head from 'next/head';
import { isAdmin } from '@/lib/admin';

export default function AdminWithdrawals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/withdrawals');
            const data = await res.json();
            if (data.success) setRequests(data.data);
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    const handleWithdrawal = async (requestId, action) => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/withdrawals/handle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action, adminNote })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Request ${action}d successfully.`);
                setRequests(requests.map(r => r._id === requestId ? { ...r, status: action === 'approve' ? 'completed' : 'rejected', adminNote } : r));
                setSelectedRequest(null);
                setAdminNote('');
            } else {
                alert(data.error);
            }
        } catch (err) { alert('Action failed'); }
        finally { setActionLoading(false); }
    };

    if (loading) return <div style={{ background: '#050505', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Syncing Ledger...</div>;

    return (
        <div style={{ background: '#050505', minHeight: '100vh', color: 'white', padding: '4rem 2rem' }}>
            <Head><title>Payout Management | Admin</title></Head>

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <CreditCard className="gold-text" size={24} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.5 }}>Payout Protocol</span>
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>Withdrawal <span className="gold-text">Requests</span></h1>
                    </div>
                </div>

                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>USER</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>AMOUNT</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>METHOD</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>STATUS</th>
                                <th style={{ padding: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>No active requests.</td>
                                </tr>
                            )}
                            {requests.map(r => (
                                <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ fontWeight: 800 }}>{r.user?.fullName}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{r.user?.email}</div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div className="gold-text" style={{ fontWeight: 900, fontSize: '1.1rem' }}>Rs {r.amount.toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>{r.method}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5, maxWidth: '200px' }} title={r.methodDetails}>{r.methodDetails}</div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{
                                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, display: 'inline-block',
                                            background: r.status === 'completed' ? 'rgba(16,185,129,0.1)' : r.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: r.status === 'completed' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b'
                                        }}>
                                            {r.status.toUpperCase()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        {r.status === 'pending' ? (
                                            <button onClick={() => setSelectedRequest(r)} className="btn-small">Process</button>
                                        ) : (
                                            <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{r.adminNote}</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Processing Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' }}>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Process Payout</h3>
                                <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={20} /></button>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>AMOUNT TO PAY</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>Rs {selectedRequest.amount.toLocaleString()}</div>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontWeight: 800 }}>{selectedRequest.method.toUpperCase()}</div>
                                    <div style={{ fontSize: '0.85rem' }}>{selectedRequest.methodDetails}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Custom Status Notification (Owned Message)</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="e.g. Withdrawal successful. Reference: #12345. Check your bank account."
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px', color: 'white', minHeight: '100px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleWithdrawal(selectedRequest._id, 'approve')}
                                    style={{ background: '#10b981', color: '#000', border: 'none', padding: '1.2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    APPROVE & SEND
                                </button>
                                <button
                                    disabled={actionLoading}
                                    onClick={() => handleWithdrawal(selectedRequest._id, 'reject')}
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '1.2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    REJECT
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .gold-text {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .btn-small {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}

export async function getServerSideProps(context) {
    const isUserAdmin = await isAdmin(context.req);
    if (!isUserAdmin) {
        return { redirect: { destination: '/', permanent: false } };
    }
    return { props: {} };
}
