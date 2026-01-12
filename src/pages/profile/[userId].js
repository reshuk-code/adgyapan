
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid, Film, Users, Play, BadgeCheck, Bell, Search, Instagram, Twitter, Globe, Settings } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';

export default function ProfilePage() {
    const router = useRouter();
    const { userId } = router.query;
    const { user: currentUser } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (!userId) return;
        async function fetchProfile() {
            try {
                const res = await fetch(`/api/profile/${userId}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                    setFollowing(json.data.profile.isFollowing);
                }
            } catch (err) { console.error(err); }
            setLoading(false);
        }
        fetchProfile();
    }, [userId]);

    const handleFollow = async () => {
        if (!currentUser) {
            router.push('/sign-in');
            return;
        }
        try {
            const res = await fetch(`/api/social/follow/${userId}`, { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                setFollowing(json.following);
                // Update local counts
                setData(prev => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        followersCount: json.following
                            ? prev.profile.followersCount + 1
                            : prev.profile.followersCount - 1
                    }
                }));
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>Loading Profile...</div>;
    if (!data) return <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>User not found.</div>;

    const { profile, ads } = data;
    const isOwnProfile = currentUser?.id === userId;

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: 'white' }}>
            <Head>
                <title>{profile.firstName} (@{profile.username || 'creator'}) | Adgyapan</title>
            </Head>

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa' }}>
                        <ArrowLeft size={18} /> Back to Feed
                    </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '4px solid rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                            marginBottom: '1.5rem',
                            background: '#222'
                        }}
                    >
                        <img src={profile.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </motion.div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '-1px' }}>{profile.firstName} {profile.lastName}</h1>
                        {profile.plan === 'pro' && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <BadgeCheck size={32} fill="#f59e0b" color="black" strokeWidth={1.5} />
                            </motion.div>
                        )}
                    </div>
                    <p style={{ color: '#3b82f6', fontWeight: '700', marginTop: '0.25rem' }}>@{profile.username || 'creator'}</p>

                    {profile.bio && (
                        <p style={{
                            maxWidth: '450px',
                            color: '#a1a1aa',
                            marginTop: '1.5rem',
                            lineHeight: '1.6',
                            fontSize: '0.95rem'
                        }}>
                            {profile.bio}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        {profile.instagram && (
                            <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#E1306C' }}>
                                <Instagram size={20} />
                            </a>
                        )}
                        {profile.twitter && (
                            <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" style={{ color: '#1DA1F2' }}>
                                <Twitter size={20} />
                            </a>
                        )}
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: '#10b981' }}>
                                <Globe size={20} />
                            </a>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        {isOwnProfile ? (
                            <Link href="/settings" className="btn btn-secondary" style={{ width: '150px', fontWeight: '700', gap: '0.5rem' }}>
                                <Settings size={16} /> Settings
                            </Link>
                        ) : (
                            <button
                                onClick={handleFollow}
                                className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ width: '150px', fontWeight: '700' }}
                            >
                                {following ? 'Following' : 'Follow'}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '3rem', marginTop: '2.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem 3rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{ads.length}</div>
                            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: '600' }}>Ads</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{profile.followersCount || 0}</div>
                            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: '600' }}>Followers</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{profile.followingCount || 0}</div>
                            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: '600' }}>Following</div>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', opacity: 0.6 }}>
                        <Grid size={20} /> <span style={{ fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase' }}>Showcase</span>
                    </div>

                    <div className="grid">
                        {ads.map((ad, i) => (
                            <motion.div
                                key={ad._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card"
                                style={{ overflow: 'hidden', cursor: 'pointer' }}
                            >
                                <Link href={`/ad/${ad.slug}`}>
                                    <div style={{ position: 'relative', aspectRatio: '9/16', overflow: 'hidden' }}>
                                        <img src={ad.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover-play">
                                            <Play fill="white" size={40} />
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.25rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{ad.title}</h3>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>{ad.viewCount || 0} views</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-play:hover { opacity: 1 !important; }
            `}</style>
        </div>
    );
}
