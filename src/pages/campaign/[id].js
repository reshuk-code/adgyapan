
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileEdit, ArrowLeft, BarChart3, Users, MousePointer2,
    Clock, Globe2, RefreshCw, MoreVertical, Layout,
    Smartphone, Calendar, Zap, TrendingUp, Download, Lock
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

export default function AnalyticsStudio() {
    const router = useRouter();
    const { id } = router.query;
    const [ad, setAd] = useState(null);
    const [stats, setStats] = useState(null);
    const [qrSrc, setQrSrc] = useState('');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // Fetch Ad Metadata
                const adRes = await fetch(`/api/ads/${id}`);
                const adData = await adRes.json();
                if (adData.success) {
                    setAd(adData.data);
                    generateQR(adData.data.slug);
                }

                // Fetch Deep Stats
                const statsRes = await fetch(`/api/stats?adId=${id}`);
                const statsData = await statsRes.json();
                if (statsData.success) {
                    setStats(statsData.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
                setTimeout(() => setSyncing(false), 1500); // Aesthetic sync delay
            }
        };

        fetchData();
    }, [id]);

    const generateQR = async (slug) => {
        const url = `${window.location.origin}/ad/${slug}`;
        try {
            const qr = await QRCode.toDataURL(url, {
                width: 600,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            setQrSrc(qr);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw size={32} color="#FFD700" />
            </motion.div>
        </div>
    );

    if (!ad) return (
        <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ color: '#ef4444' }}>Campaign not found</h2>
            <Link href="/dashboard" className="btn btn-secondary" style={{ marginTop: '2rem' }}>Return to Dashboard</Link>
        </div>
    );

    const metrics = [
        { label: 'Total Exposure', value: stats?.summary?.totalViews || 0, sub: 'Total Views', icon: Users, color: '#FFD700' },
        { label: 'AR Engagement', value: stats?.summary?.totalArViews || 0, sub: 'Immersive Views', icon: Layout, color: '#3b82f6' },
        { label: 'Conversion Rate', value: `${((stats?.summary?.totalClicks / stats?.summary?.totalViews) * 100 || 0).toFixed(1)}%`, sub: 'Click-Through', icon: MousePointer2, color: '#10b981' },
        { label: 'Avg Persistence', value: `${stats?.summary?.avgScreenTime || 0}s`, sub: 'Attention Span', icon: Clock, color: '#8b5cf6' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '4rem' }}>
            {/* Header / Top Nav */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', sticky: 'top', zIndex: 100 }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <Link href="/dashboard" style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <ArrowLeft size={16} /> Dashboard
                        </Link>
                        <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div>
                            <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {ad.title}
                                <span style={{ fontSize: '0.65rem', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                    Live Studio
                                </span>
                            </h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <AnimatePresence>
                            {syncing && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                                    Synchronizing Real-time Node...
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Link href={`/edit/${ad._id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            <FileEdit size={14} /> Edit Campaign
                        </Link>
                    </div>
                </div>
            </div>

            <main className="container" style={{ marginTop: '3rem' }}>
                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {metrics.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '24px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: `${m.color}10`, color: m.color }}>
                                    <m.icon size={20} />
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#52525b', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {m.sub}
                                </div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-1px' }}>
                                {m.value}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{m.label}</div>

                            {/* Accent Glow */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: `${m.color}05`, filter: 'blur(30px)' }} />
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                    {/* Main Chart Area */}
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Performance Velocity</h3>
                                    <p style={{ margin: 0, color: '#52525b', fontSize: '0.85rem' }}>Engagement trends for the last 30 intervals</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#a1a1aa' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FFD700' }} /> Impressions
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#a1a1aa' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6' }} /> Actions
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '350px', width: '100%', filter: ad.userPlan === 'basic' ? 'blur(10px)' : 'none', transition: 'filter 0.5s ease' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.daily || []}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#52525b', fontSize: 10 }}
                                            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="views" stroke="#FFD700" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                                        <Area type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {ad.userPlan === 'basic' && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                    <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #FFD700', padding: '2rem', borderRadius: '24px', textAlign: 'center', maxWidth: '300px' }}>
                                        <Lock size={32} style={{ color: '#FFD700', marginBottom: '1rem' }} />
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>Pro Analytics Slot</h4>
                                        <p style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>Detailed engagement velocity is reserved for our elite partners.</p>
                                        <Link href="/pricing" className="btn btn-primary" style={{ background: '#FFD700', color: '#000', width: '100%', justifyContent: 'center' }}>Upgrade Now</Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Secondary Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Hourly Thermal */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 800 }}>Hourly Intensity</h4>
                                <div style={{ height: '150px', filter: ad.userPlan === 'basic' ? 'blur(8px)' : 'none' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats?.hourly || []}>
                                            <Bar dataKey="views">
                                                {(stats?.hourly || []).map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.views > 0 ? '#FFD700' : 'rgba(255,255,255,0.05)'}
                                                        fillOpacity={Math.max(0.1, entry.views / (Math.max(...stats.hourly.map(h => h.views)) || 1))}
                                                    />
                                                ))}
                                            </Bar>
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={() => null} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: '#52525b', fontSize: '0.65rem' }}>
                                    <span>00:00</span>
                                    <span>PEAK ENGAGEMENT</span>
                                    <span>23:59</span>
                                </div>

                                {ad.userPlan === 'basic' && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        <Lock size={20} style={{ color: '#FFD700' }} />
                                    </div>
                                )}
                            </div>

                            {/* Geo Location */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 800 }}>Spatial Geo-Fence</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {(stats?.geo?.countries || []).length > 0 ? (
                                        stats.geo.countries.slice(0, 4).map((c, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '24px', height: '16px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }} />
                                                    <span style={{ fontSize: '0.85rem' }}>{c.code}</span>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 900, fontFamily: 'monospace' }}>{c.count}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#52525b', fontSize: '0.8rem' }}>
                                            Collecting Global Nodes...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Assets & QR */}
                    <aside style={{ display: 'grid', gap: '2rem', contentVisibility: 'auto' }}>
                        {/* QR Box */}
                        <div style={{ background: '#fff', borderRadius: '32px', padding: '1.5rem', color: '#000', textAlign: 'center' }}>
                            <div style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '24px', marginBottom: '1.5rem' }}>
                                {qrSrc && <img src={qrSrc} alt="QR Code" style={{ width: '100%', maxWidth: '200px' }} />}
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem', fontWeight: 900 }}>Scan to Preview</h4>
                            <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1.5rem' }}>Connect high-precision tracking via mobile AR node</p>
                            <a href={qrSrc} download={`studio-qr-${ad.slug}.png`} className="btn btn-secondary" style={{ width: '100%', background: '#000', color: '#fff', border: 'none' }}>
                                <Download size={14} /> Export Scan-Key
                            </a>
                        </div>

                        {/* Asset Preview */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Master Assets</h4>
                                <Link href={`/ad/${ad.slug}`} target="_blank" style={{ color: '#FFD700', fontSize: '0.7rem' }}>View Live Node</Link>
                            </div>
                            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', aspectRatio: '1', background: '#000' }}>
                                <img src={ad.imageUrl} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', color: '#52525b', textTransform: 'uppercase', marginBottom: '4px' }}>Public Link</div>
                                <div style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: '#a1a1aa', fontFamily: 'monospace' }}>
                                    {window.location.origin}/ad/{ad.slug}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <style jsx>{`
                .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .btn-secondary {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #fff;
                }
                .btn-secondary:hover {
                    background: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );
}
