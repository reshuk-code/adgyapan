
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import {
    ArrowLeft, TrendingUp, Eye, MousePointer2, Zap, BarChart3, Lock, Crown, Info, MapPin, Clock, Timer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ daily: [], hourly: [], geo: { countries: [], cities: [] }, summary: {} });
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/stats');
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
        fetchStats();
    }, []);

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
        <div className="container" style={{ marginTop: '3rem', paddingBottom: '5rem' }}>
            <Head>
                <title>Pro Analytics - Adgyapan</title>
            </Head>

            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        Deep Analytics <Crown size={32} style={{ color: '#f59e0b' }} />
                    </h1>
                    <p style={{ color: '#a1a1aa' }}>Professional engagement & geographic insights</p>
                </div>
                <div className="glass-card" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                    <TrendingUp size={14} /> Last 30 Days
                </div>
            </header>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Views', value: data.summary.totalViews, icon: <Eye />, color: '#fe2c55' },
                    { label: 'CTA Clicks', value: data.summary.totalClicks, icon: <MousePointer2 />, color: '#10b981' },
                    {
                        label: 'Avg Screen Time',
                        value: (() => {
                            const totalSeconds = Math.round(data.summary.avgScreenTime || 0);
                            const mins = Math.floor(totalSeconds / 60);
                            const secs = totalSeconds % 60;
                            return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
                        })(),
                        icon: <Timer />,
                        color: '#8b5cf6'
                    },
                    { label: 'Conversion Rate', value: `${data.summary.totalViews > 0 ? ((data.summary.totalClicks / data.summary.totalViews) * 100).toFixed(2) : '0.00'}%`, icon: <TrendingUp />, color: '#f59e0b' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card"
                        style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    >
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${stat.color}15`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '2px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Performance Chart */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                        <BarChart3 size={20} color="#fe2c55" /> Engagement Trends
                    </h3>
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

                {/* Hourly Peak Chart */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                        <Clock size={20} color="#f59e0b" /> Peak Hours (Global)
                    </h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.hourly}>
                                <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} stroke="#52525b" fontSize={11} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip mode="hour" />} />
                                <Bar dataKey="views" name="Avg Views" radius={[4, 4, 0, 0]}>
                                    {data.hourly.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.views > 0 ? '#3b82f6' : '#27272a'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                        <MapPin size={20} color="#10b981" /> Top Cities
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.geo.cities.length > 0 ? data.geo.cities.sort((a, b) => b.count - a.count).slice(0, 5).map((city, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                <span style={{ fontWeight: 600 }}>{city.name}</span>
                                <span style={{ color: '#a1a1aa' }}>{city.count} views</span>
                            </div>
                        )) : <p style={{ color: '#3f3f46', textAlign: 'center', padding: '2rem' }}>No city data yet</p>}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                        <TrendingUp size={20} color="#8b5cf6" /> Pro Tips & Insights
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '1rem' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Screen Time vs Recall</p>
                            <p style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                                Your ads maintain a <strong>{data.summary.avgScreenTime}s</strong> focus duration. High engagement usually leads to 3x better recall.
                            </p>
                        </div>
                        <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '1rem' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Peak Optimization</p>
                            <p style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                                Consider launching new campaigns around <strong>{data.hourly.reduce((max, h) => h.views > max.views ? h : max, { hour: 0, views: 0 }).hour}:00</strong> to capture your maximum organic audience.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
