import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Search, Bell, Compass, X, TrendingUp, ShieldAlert, Settings, Plus, Crown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MarketplaceIcon from './MarketplaceIcon';

const HamburgerIcon = ({ isOpen }) => (
    <div style={{ position: 'relative', width: '20px', height: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
        <motion.div
            animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            style={{ width: '20px', height: '2px', background: 'currentColor', borderRadius: '10px' }}
        />
        <motion.div
            animate={isOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
            style={{ width: '20px', height: '2px', background: 'currentColor', borderRadius: '10px' }}
        />
        <motion.div
            animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            style={{ width: '20px', height: '2px', background: 'currentColor', borderRadius: '10px' }}
        />
    </div>
);

export default function Layout({ children, fullPage = false }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [pendingItems, setPendingItems] = useState(0);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Check Admin & Profile
                const res = await fetch('/api/user/kyc');
                if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                    const data = await res.json();
                    if (data.success && data.data.isAdmin) {
                        setIsAdmin(true);
                        const statsRes = await fetch('/api/admin/stats/pending');
                        if (statsRes.ok && statsRes.headers.get('content-type')?.includes('application/json')) {
                            const statsData = await statsRes.json();
                            if (statsData.success) setPendingItems(statsData.data.count);
                        }
                    }
                }

                // Check Subscription
                const subRes = await fetch('/api/subscriptions/me');
                if (subRes.ok && subRes.headers.get('content-type')?.includes('application/json')) {
                    const subData = await subRes.json();
                    if (subData.success && subData.data.plan === 'pro' && subData.data.status === 'active') {
                        setIsPro(true);
                    }
                }
            } catch (err) {
                console.warn('Silent status check failure:', err.message);
            }
        };
        checkStatus();
    }, []);

    const menuVariants = {
        closed: { opacity: 0, y: "-100%" },
        open: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 20,
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        closed: { opacity: 0, y: 20 },
        open: { opacity: 1, y: 0 }
    };

    return (
        <div className="layout" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <header className="navbar" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: fullPage
                    ? (mobileMenuOpen ? 'transparent' : 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)')
                    : 'rgba(0, 0, 0, 0.7)',
                borderBottom: (fullPage || mobileMenuOpen) ? 'none' : '1px solid var(--border)',
                backdropFilter: (fullPage || mobileMenuOpen) ? 'none' : 'blur(10px)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center'
            }}>
                <div className="navbar-content" style={{
                    width: '100%',
                    maxWidth: fullPage ? 'none' : '1200px',
                    margin: '0 auto',
                    padding: '0 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Link href="/" className="brand-link" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        {isPro && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <Crown size={22} className="gold-text" fill="#FFD700" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' }} />
                            </motion.div>
                        )}
                        <span className={`logo ${isPro ? 'pro-logo-text' : ''}`}>Adgyapan</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="nav-links desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <SignedIn>
                            <Link href="/explore" className="nav-link" title="Explore"><Compass size={20} /></Link>
                            <Link href="/search" className="nav-link" title="Search"><Search size={20} /></Link>
                            <Link href="/notifications" className="nav-link" title="Notifications"><Bell size={20} /></Link>
                            <Link href="/marketplace" className="nav-link" title="Marketplace"><MarketplaceIcon size={20} /></Link>
                            <Link href="/dashboard" className="nav-link">Dashboard</Link>
                            <Link href="/dashboard/activities" className="nav-link">Ad Activities</Link>
                            {isAdmin && (
                                <Link href="/admin" className="nav-link" style={{ color: '#FFD700', fontWeight: 800, position: 'relative' }}>
                                    Admin
                                    {pendingItems > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: -5,
                                            right: -10,
                                            background: '#ef4444',
                                            color: 'white',
                                            fontSize: '0.6rem',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {pendingItems}
                                        </span>
                                    )}
                                </Link>
                            )}
                            <Link href="/create" className="premium-button" style={{ height: '2.5rem', padding: '0 1.5rem', fontSize: '0.8rem' }}>
                                <Plus size={16} /> New Campaign
                            </Link>
                            <Link href="/settings" className="nav-link" title="Settings"><Settings size={20} /></Link>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="btn btn-secondary" style={{ height: '2.2rem' }}>Sign In</button>
                            </SignInButton>
                        </SignedOut>
                    </nav>

                    {/* Mobile Menu Button - PREMIUM ANIMATED HAMBURGER */}
                    <motion.button
                        className="hamburger-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        whileTap={{ scale: 0.9 }}
                    >
                        <HamburgerIcon isOpen={mobileMenuOpen} />
                    </motion.button>
                </div>
            </header>

            {/* FULL SCREEN MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className={`mobile-menu-overlay ${fullPage ? 'full-page' : ''}`}
                    >
                        {/* Close Button */}
                        <motion.button
                            className="mobile-menu-close"
                            onClick={() => setMobileMenuOpen(false)}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <X size={24} />
                        </motion.button>

                        <div className="mobile-nav-container">
                            <motion.div variants={itemVariants}>
                                <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <Compass size={24} /> <span>Explore Feed</span>
                                </Link>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <Search size={24} /> <span>Search Ads</span>
                                </Link>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <Bell size={24} /> <span>Notifications</span>
                                </Link>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <MarketplaceIcon size={24} /> <span>Marketplace</span>
                                </Link>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <div className="dot" /> <span>Creator Dashboard</span>
                                </Link>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Link href="/dashboard/activities" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <div className="dot" style={{ background: '#FFD700' }} /> <span>Ad Activities</span>
                                </Link>
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <Settings size={24} /> <span>Settings</span>
                                </Link>
                            </motion.div>
                            {isAdmin && (
                                <motion.div variants={itemVariants}>
                                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item" style={{ color: '#FFD700', position: 'relative' }}>
                                        <ShieldAlert size={24} />
                                        <span>Admin Panel</span>
                                        {pendingItems > 0 && (
                                            <span style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                marginLeft: 'auto'
                                            }}>
                                                {pendingItems} New
                                            </span>
                                        )}
                                    </Link>
                                </motion.div>
                            )}
                            <motion.div variants={itemVariants}>
                                <Link href="/create" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ height: '4rem', width: '100%', fontSize: '1.2rem', borderRadius: '24px' }}>
                                    Launch New Campaign
                                </Link>
                            </motion.div>
                        </div>

                        <SignedIn>
                            <motion.div variants={itemVariants} className="mobile-footer">
                                <div className="mobile-user-card">
                                    <UserButton afterSignOutUrl="/" />
                                    <div className="mobile-user-info">
                                        <span className="mobile-account-label">Active Account</span>
                                        <span className="mobile-account-status">Live Session</span>
                                    </div>
                                </div>
                            </motion.div>
                        </SignedIn>

                        <SignedOut>
                            <motion.div variants={itemVariants} style={{ marginTop: 'auto' }}>
                                <SignInButton mode="modal">
                                    <button className="btn btn-primary" style={{ width: '100%', height: '4rem', fontSize: '1.2rem', borderRadius: '24px' }}>Sign In to Account</button>
                                </SignInButton>
                            </motion.div>
                        </SignedOut>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className={`main-content ${fullPage ? 'full-page' : ''}`} style={{
                flex: 1,
                paddingBottom: fullPage ? 0 : '4rem'
            }}>
                {children}
            </main>

            {
                !fullPage && (
                    <footer className="footer" style={{ borderTop: '1px solid var(--border)', padding: '4rem 0', opacity: 0.5 }}>
                        <div className="container" style={{ textAlign: 'center' }}>
                            <div className="logo" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Adgyapan</div>
                            <p style={{ fontSize: '0.8rem' }}>© {new Date().getFullYear()} Interactive AR Advertising Platform.</p>
                        </div>
                    </footer>
                )
            }

        </div>
    );
}
