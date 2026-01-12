
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ExternalLink, ShieldCheck, Clock } from 'lucide-react';

export default function AdminSubscriptions() {
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/subscriptions')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSubs(data.data);
                setLoading(false);
            });
    }, []);

    const handleVerify = async (id, status) => {
        try {
            const res = await fetch(`/api/admin/subscriptions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setSubs(subs.map(s => s._id === id ? { ...s, status } : s));
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="container">Loading Subscriptions...</div>;

    return (
        <div className="container" style={{ marginTop: '3rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <ShieldCheck size={32} color="#10b981" />
                <h1 style={{ margin: 0 }}>Payment Verification</h1>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a', fontSize: '0.85rem' }}>
                            <th style={{ padding: '1.2rem' }}>User ID</th>
                            <th style={{ padding: '1.2rem' }}>Plan</th>
                            <th style={{ padding: '1.2rem' }}>Amount</th>
                            <th style={{ padding: '1.2rem' }}>Proof</th>
                            <th style={{ padding: '1.2rem' }}>Status</th>
                            <th style={{ padding: '1.2rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subs.map(sub => (
                            <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1.2rem', fontSize: '0.85rem', color: '#a1a1aa' }}>{sub.userId}</td>
                                <td style={{ padding: '1.2rem' }}><span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{sub.plan}</span></td>
                                <td style={{ padding: '1.2rem' }}>NPR {sub.amount}</td>
                                <td style={{ padding: '1.2rem' }}>
                                    <a href={sub.paymentProof} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.85rem' }}>
                                        View Proof <ExternalLink size={14} />
                                    </a>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                                        background: sub.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: sub.status === 'active' ? '#10b981' : '#f59e0b'
                                    }}>
                                        {sub.status === 'pending' ? <><Clock size={12} style={{ marginRight: '5px' }} /> Pending</> : sub.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    {sub.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleVerify(sub._id, 'active')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', border: 'none' }}>
                                                Approve
                                            </button>
                                            <button onClick={() => handleVerify(sub._id, 'inactive')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
