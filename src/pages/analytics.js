
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    ArrowLeft, TrendingUp, Eye, MousePointer2, Zap, BarChart3, Lock, Crown, Info, MapPin, Clock, Timer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ daily: [], hourly: [], geo: { countries: [], cities: [] }, summary: {}, ads: [] });
    const [error, setError] = useState(null);
    const [selectedAd, setSelectedAd] = useState('all');

    useEffect(() => {
        fetchStats('all');
    }, []);

    async function fetchStats(adId) {
        setLoading(true);
        try {
            const res = await fetch(`/api/stats?adId=${adId}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleAdChange = (e) => {
        const id = e.target.value;
        setSelectedAd(id);
        fetchStats(id);
    };

    if (loading) return <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>Loading Deep Analytics...</div>;

    if (error) {
        return (
            <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
                    <Lock size={48} style={{ color: '#f59e0b', marginBottom: '1.5rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Pro Feature</h2>
                    <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>{error}</p>
                    <Link href="/pricing" className="btn btn-primary" style={{ width: '100%' }}>
                        Upgrade to Pro Now
                    </Link>
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label, mode = 'date' }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card" style={{ padding: '10px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>
                        {mode === 'date' ? format(parseISO(label), 'MMM dd, yyyy') : `${label}:00`}
                    </p>
                    {payload.map((p, i) => (
                        <p key={i} style={{ fontSize: '0.75rem', color: p.color || p.fill }}>
                            {p.name}: {p.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
            <Head>
                <title>Pro Analytics - Adgyapan</title>
            </Head>

            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Dashboard
            </Link>

            <header style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Intelligence</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 215, 0, 0.1)', padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                        <Crown size={18} fill="#FFD700" color="black" />
                        <span className="gold-text" style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase' }}>Pro Stats</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="glass-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={16} />
                        <select
                            value={selectedAd}
                            onChange={handleAdChange}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                outline: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                minWidth: '180px'
                            }}
                        >
                            <option value="all" style={{ background: '#000' }}>Full Performance</option>
                            {data.ads && data.ads.map(ad => (
                                <option key={ad._id} value={ad._id} style={{ background: '#000' }}>
                                    {ad.title.length > 30 ? ad.title.substring(0, 30) + '...' : ad.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="glass-card" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontWeight: 700 }}>
                        <Clock size={16} /> 30D Window
                    </div>
                </div>
            </header>

            {data.summary.isPeriodEmpty && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem 1.5rem', borderRadius: '12px', color: '#60a5fa', fontSize: '0.85rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                >
                    <Info size={16} />
                    <span>Showing lifetime totals while your 30-day activity window synchronizes.</span>
                </motion.div>
            )}

            {/* Summary Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                {[
                    { label: 'Total Reach', value: data.summary.totalViews, icon: <Eye />, color: '#fe2c55', desc: 'Unique visual impressions' },
                    { label: 'Actionable Clicks', value: data.summary.totalClicks, icon: <MousePointer2 />, color: '#10b981', desc: 'Direct CTA engagements' },
                    {
                        label: 'Interaction Rate',
                        value: `${data.summary.totalViews > 0 ? ((data.summary.totalClicks / data.summary.totalViews) * 100).toFixed(2) : '0.00'}%`,
                        icon: <Zap />,
                        color: '#f59e0b',
                        desc: 'Engagement efficiency'
                    },
                    {
                        label: 'Retention',
                        value: (() => {
                            const totalSeconds = Math.round(data.summary.avgScreenTime || 0);
                            const mins = Math.floor(totalSeconds / 60);
                            const secs = totalSeconds % 60;
                            return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                        })(),
                        icon: <Timer />,
                        color: '#8b5cf6',
                        desc: 'Average attention span'
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card"
                        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ padding: '12px', borderRadius: '16px', background: `${stat.color}15`, color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 800 }}>{stat.label}</p>
                                <h3 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0 }}>{stat.value}</h3>
                            </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>{stat.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                {/* Traffic Attribution */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Source Attribution</h3>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Where your audience discovered the experience</p>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'AR Scan', value: data.summary.totalArViews || 0 },
                                        { name: 'Feed Discovery', value: data.summary.totalFeedViews || 0 }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    <Cell key="cell-ar" fill="#10b981" />
                                    <Cell key="cell-feed" fill="#3b82f6" />
                                </Pie>
                                <Tooltip content={<CustomTooltip mode="category" />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} /> AR SCAN
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }} /> FEED
                        </div>
                    </div>
                </div>

                {/* Engagement Over Time */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Engagement Trends</h3>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Daily activity performance</p>
                    </div>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <AreaChart data={data.daily}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fe2c55" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#fe2c55" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(str) => format(parseISO(str), 'MMM d')} stroke="#52525b" fontSize={11} axisLine={false} tickLine={false} />
                                <YAxis stroke="#52525b" fontSize={11} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip mode="date" />} />
                                <Area type="monotone" name="Views" dataKey="views" stroke="#fe2c55" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                                <Area type="monotone" name="Clicks" dataKey="clicks" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Hourly & Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={20} color="#3b82f6" /> Engagement by Hour
                        </h3>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>Peak activity window detection</p>
                    </div>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.hourly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="hour" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(h) => `${h}h`} />
                                <Tooltip content={<CustomTooltip mode="category" />} />
                                <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                        <TrendingUp size={20} color="#8b5cf6" /> Real-time Insights
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '1.25rem' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Optimized Window</p>
                            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5 }}>
                                Engagement peaks around <strong>{data.hourly.reduce((max, h) => h.views > max.views ? h : max, { hour: 0, views: 0 }).hour}:00</strong> local time.
                            </p>
                        </div>
                        <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '1.25rem' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Retention Grade</p>
                            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5 }}>
                                Average focus is <strong>{data.summary.avgScreenTime}s</strong>. This puts you in the top 15% of performance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Geographical Section */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MapPin size={20} color="#10b981" /> Global Reach
                    </h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Top Hit Regions</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {data.geo.cities.length > 0 ? data.geo.cities.sort((a, b) => b.count - a.count).slice(0, 8).map((city, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{city.name}</span>
                            <span style={{ fontWeight: 800, color: '#10b981' }}>{city.count} <small style={{ fontWeight: 400, opacity: 0.6 }}>Scans</small></span>
                        </div>
                    )) : <p style={{ color: '#3f3f46', textAlign: 'center', gridColumn: '1/-1', padding: '2rem' }}>Waiting for global data footprint...</p>}
                </div>
            </div>
        </div>
    );
}
