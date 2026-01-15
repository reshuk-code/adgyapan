import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, User, Building, MessageSquare, Download, Filter } from 'lucide-react';
import Head from 'next/head';
import { isAdmin } from '@/lib/admin';

export default function AdminLeads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' or 'platform'

    useEffect(() => {
        const init = async () => {
            await fetchLeads();
            markAsRead();
        };
        init();
    }, [filter]);

    const markAsRead = async () => {
        try {
            await fetch('/api/admin/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'leads' })
            });
        } catch (err) { console.error(err); }
    };

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const query = filter === 'platform' ? '?platform=true' : '';
            const res = await fetch(`/api/admin/leads${query}`);
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#050505', minHeight: '100vh', color: 'white', padding: '4rem 2rem' }}>
            <Head><title>Lead Management | Adgyapan Admin</title></Head>

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <Mail className="gold-text" size={24} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.5 }}>Communication Hub</span>
                        </div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>Lead <span className="gold-text">Database</span></h1>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                            <button
                                onClick={() => setFilter('all')}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: filter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: filter === 'all' ? 'white' : 'rgba(255,255,255,0.5)',
                                    fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                ALL LEADS
                            </button>
                            <button
                                onClick={() => setFilter('platform')}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: filter === 'platform' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: filter === 'platform' ? 'white' : 'rgba(255,255,255,0.5)',
                                    fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                PLATFORM ONLY
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>Loading leads...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {leads.length === 0 && <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.3 }}>No leads found.</div>}

                        {leads.map((lead, i) => (
                            <motion.div
                                key={lead._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '24px',
                                    padding: '2rem',
                                    display: 'flex',
                                    gap: '2rem',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{
                                    width: '50px', height: '50px', borderRadius: '16px',
                                    background: lead.source === 'website' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: lead.source === 'website' ? '#FFD700' : '#10b981',
                                    flexShrink: 0
                                }}>
                                    {lead.source === 'website' ? <User size={24} /> : <Filter size={24} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{lead.leadData?.name || 'Anonymous'}</h3>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(lead.createdAt).toLocaleString()}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem', color: '#a1a1aa' }}>
                                        {lead.leadData?.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Mail size={14} /> {lead.leadData.email}
                                            </div>
                                        )}
                                        {lead.leadData?.company && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Building size={14} /> {lead.leadData.company}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                {lead.source}
                                            </span>
                                        </div>
                                    </div>

                                    {lead.leadData?.message && (
                                        <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', fontStyle: 'italic', borderLeft: '3px solid rgba(255,255,255,0.1)' }}>
                                            "{lead.leadData.message}"
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
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
