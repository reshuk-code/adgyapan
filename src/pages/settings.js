
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Save, Camera, Mail, Globe, AtSign, Smartphone, BarChart3, Info } from 'lucide-react';

export default function Settings() {
    const { user, isLoaded } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        bio: '',
        website: '',
        twitter: '',
        instagram: '',
        avatarUrl: '',
        countBothViews: false,
        notifications: {
            email: true,
            push: false,
            marketing: true
        }
    });

    useEffect(() => {
        if (isLoaded && user) {
            fetchProfile();
        }
    }, [isLoaded, user]);

    const fetchProfile = async () => {
        try {
            // Use KYC endpoint as it returns the full profile including private fields
            const res = await fetch('/api/user/kyc');
            const responseData = await res.json();

            // Check for profile in data.data (standard) or data.profile directly (legacy/fallback)
            const profile = responseData.data?.profile || responseData.profile;

            if (profile) {
                setFormData({
                    bio: profile.bio || '',
                    website: profile.website || '',
                    twitter: profile.twitter || '',
                    instagram: profile.instagram || '',
                    avatarUrl: profile.avatarUrl || user.imageUrl,
                    countBothViews: profile.countBothViews || false,
                    notifications: profile.notifications || { email: true, push: false, marketing: true }
                });
            }
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handlePushToggle = async (checked) => {
        // Update local UI immediately for better UX
        setFormData(prev => ({
            ...prev,
            notifications: { ...prev.notifications, push: checked }
        }));

        if (checked) {
            toast.loading('Requesting permission...', { id: 'push-perm' });
            if (!('Notification' in window)) {
                toast.error('Notifications not supported', { id: 'push-perm' });
                return;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    toast.success('Permission granted!', { id: 'push-perm' });
                    // Register SW logic would go here
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.register('/sw.js');
                    }
                } else {
                    toast.error('Permission denied', { id: 'push-perm' });
                    // Revert state if denied
                    setFormData(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, push: false }
                    }));
                }
            } catch (error) {
                console.error(error);
                toast.error('Error enabling notifications', { id: 'push-perm' });
            }
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData) // Sends countBothViews now
            });
            const data = await res.json();
            if (data.success) {
                alert('Settings updated successfully! ✨');
            } else {
                alert('Failed to update settings: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while saving.');
        }
        setSaving(false);
    };

    if (loading) return (
        <div style={{ padding: '4rem', color: 'white', textAlign: 'center' }}>Loading Settings...</div>
    );

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '3rem' }}
            >
                <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Settings
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Manage your profile, preferences, and account security.</p>
            </motion.div>

            <div style={{ display: 'grid', gap: '2rem' }}>

                {/* Public Profile */}
                <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <User size={24} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Public Profile</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'start' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                                <img src={formData.avatarUrl || user.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}>
                                <Camera size={14} /> Change
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Display Name</label>
                                <input
                                    type="text"
                                    value={user.fullName || ''}
                                    disabled
                                    style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Managed by Clerk (Login Provider).</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell the world about yourself..."
                                    rows={4}
                                    style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Website</label>
                                    <div style={{ position: 'relative' }}>
                                        <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                        <input
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://..."
                                            style={{ width: '100%', padding: '1rem 1rem 1rem 2.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Twitter</label>
                                    <div style={{ position: 'relative' }}>
                                        <AtSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                        <input
                                            value={formData.twitter}
                                            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                            placeholder="@username"
                                            style={{ width: '100%', padding: '1rem 1rem 1rem 2.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Instagram</label>
                                    <div style={{ position: 'relative' }}>
                                        <AtSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                        <input
                                            value={formData.instagram}
                                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                            placeholder="@username"
                                            style={{ width: '100%', padding: '1rem 1rem 1rem 2.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Preferences */}
                <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>
                        <BarChart3 size={24} className="purple-text" style={{ color: '#8b5cf6' }} /> Analytics Preferences
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e4e4e7' }}>Count Both AR & Feed Views</label>
                                <div style={{ position: 'relative', display: 'inline-block', cursor: 'help' }} title="When enabled, views from both AR viewer and video feed count toward your analytics.">
                                    <Info size={16} style={{ color: '#71717a' }} />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
                                Enable to include feed interactions in your total view count. Disable to track only direct AR engagement.
                            </p>
                        </div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', marginLeft: '1.5rem' }}>
                            <input
                                type="checkbox"
                                checked={formData.countBothViews}
                                onChange={(e) => setFormData({ ...formData, countBothViews: e.target.checked })}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span className="slider round" style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: formData.countBothViews ? '#ec4899' : 'rgba(255,255,255,0.1)',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '18px', width: '18px', left: '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                    transform: formData.countBothViews ? 'translateX(24px)' : 'translateX(0)'
                                }} />
                            </span>
                        </label>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                            <Bell size={24} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Notifications</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {[
                            { id: 'email', label: 'Email Alerts', icon: Mail, desc: 'Get updates about your campaigns via email.' },
                            { id: 'push', label: 'Push Notifications', icon: Bell, desc: 'Real-time alerts on your device.' },
                            { id: 'marketing', label: 'Product Updates', icon: Globe, desc: 'News about new features and updates.' },
                        ].map((item) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <item.icon size={20} color="rgba(255,255,255,0.5)" />
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{item.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{item.desc}</div>
                                    </div>
                                </div>
                                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.notifications[item.id]}
                                        onChange={(e) => {
                                            if (item.id === 'push') {
                                                handlePushToggle(e.target.checked);
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    notifications: {
                                                        ...formData.notifications,
                                                        [item.id]: e.target.checked
                                                    }
                                                });
                                            }
                                        }}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span className="slider round" style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: formData.notifications[item.id] ? '#ec4899' : 'rgba(255,255,255,0.1)',
                                        transition: '.4s', borderRadius: '34px'
                                    }}>
                                        <span style={{
                                            position: 'absolute', content: '""', height: '18px', width: '18px', left: '4px', bottom: '4px',
                                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                            transform: formData.notifications[item.id] ? 'translateX(24px)' : 'translateX(0)'
                                        }} />
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <motion.div
                    style={{ position: 'sticky', bottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="premium-button"
                        style={{
                            padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000',
                            boxShadow: '0 10px 30px rgba(255, 215, 0, 0.2)'
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
