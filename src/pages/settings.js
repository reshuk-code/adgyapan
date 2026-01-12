
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Save, Github, Instagram, Twitter, Globe, AlignLeft, User, CheckCircle2, BarChart3, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { user, isLoaded } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        bio: '',
        instagram: '',
        twitter: '',
        website: '',
        countBothViews: false
    });

    useEffect(() => {
        if (!isLoaded || !user) return;
        async function fetchProfile() {
            try {
                const res = await fetch(`/api/profile/${user.id}`);
                const data = await res.json();
                if (data.success && data.data.profile) {
                    const p = data.data.profile;
                    setForm({
                        bio: p.bio || '',
                        instagram: p.instagram || '',
                        twitter: p.twitter || '',
                        website: p.website || '',
                        countBothViews: p.countBothViews !== undefined ? p.countBothViews : false
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [isLoaded, user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Ensure all form fields including countBothViews are sent
            const payload = {
                bio: form.bio,
                instagram: form.instagram,
                twitter: form.twitter,
                website: form.website,
                countBothViews: form.countBothViews
            };

            console.log('Saving profile with data:', payload); // Debug log

            const res = await fetch('/api/profile/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Profile updated successfully!', {
                    icon: <CheckCircle2 style={{ color: '#10b981' }} />,
                    style: {
                        background: '#18181b',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                });
            } else {
                toast.error(data.error || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Profile save error:', err);
            toast.error('Connection error');
        } finally {
            setSaving(false);
        }
    };

    if (!isLoaded || loading) return <div className="container" style={{ marginTop: '5rem' }}>Loading Settings...</div>;

    return (
        <div className="container" style={{ marginTop: '3rem', paddingBottom: '5rem', maxWidth: '800px' }}>
            <Head>
                <title>Settings - Adgyapan</title>
            </Head>

            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Account Settings</h1>
                <p style={{ color: '#a1a1aa' }}>Customize your identity on the Adgyapan ecosystem</p>
            </header>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Profile Section */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <User size={20} style={{ color: '#fe2c55' }} /> Public Profile
                    </h3>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <AlignLeft size={16} /> Bio
                        </label>
                        <textarea
                            className="input"
                            placeholder="Tell the world about your AR vision..."
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            maxLength={160}
                            style={{ minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#52525b', marginTop: '0.5rem' }}>
                            {form.bio.length}/160
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Globe size={20} style={{ color: '#3b82f6' }} /> Social Presence
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Instagram size={16} style={{ color: '#E1306C' }} /> Instagram Username
                            </label>
                            <input
                                className="input"
                                type="text"
                                placeholder="@yourhandle"
                                value={form.instagram}
                                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Twitter size={16} style={{ color: '#1DA1F2' }} /> Twitter/X Username
                            </label>
                            <input
                                className="input"
                                type="text"
                                placeholder="@yourhandle"
                                value={form.twitter}
                                onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Globe size={16} style={{ color: '#10b981' }} /> Personal Website
                            </label>
                            <input
                                className="input"
                                type="url"
                                placeholder="https://yourbrand.com"
                                value={form.website}
                                onChange={(e) => setForm({ ...form, website: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Analytics Preferences */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={20} style={{ color: '#8b5cf6' }} /> Analytics Preferences
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e4e4e7' }}>Count Both AR & Feed Views</label>
                                <div style={{ position: 'relative', display: 'inline-block', cursor: 'help' }} title="When enabled, views from both AR viewer and video feed count toward your analytics. When disabled, only AR viewer interactions are tracked.">
                                    <Info size={16} style={{ color: '#71717a' }} />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
                                When enabled, both AR viewer and video feed interactions count toward your view statistics and screen time. Disable to track only AR viewer engagement for more precise AR-specific analytics.
                            </p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', marginLeft: '1.5rem', flexShrink: 0 }}>
                            <input
                                type="checkbox"
                                checked={form.countBothViews}
                                onChange={(e) => setForm({ ...form, countBothViews: e.target.checked })}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: form.countBothViews ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                transition: '0.3s',
                                borderRadius: '28px',
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '',
                                    height: '20px',
                                    width: '20px',
                                    left: form.countBothViews ? '28px' : '4px',
                                    bottom: '4px',
                                    backgroundColor: 'white',
                                    transition: '0.3s',
                                    borderRadius: '50%'
                                }} />
                            </span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Link href={`/profile/${user?.id}`} className="btn btn-secondary">
                        View Public Profile
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                        style={{ padding: '0.8rem 2.5rem', gap: '0.5rem' }}
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
