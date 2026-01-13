import { useState } from 'react';
import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Search, Bell, Compass, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
                position: 'fixed', // Fixed for all pages to ensure stability during menu open
                top: 0,
                left: 0,
                right: 0,
                background: fullPage
                    ? (mobileMenuOpen ? 'transparent' : 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)')
                    : 'rgba(0, 0, 0, 0.7)',
                borderBottom: (fullPage || mobileMenuOpen) ? 'none' : '1px solid var(--border)',
                backdropFilter: (fullPage || mobileMenuOpen) ? 'none' : 'blur(10px)',
                zIndex: 2000,
                height: '70px',
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
                    <Link href="/" className="logo" onClick={() => setMobileMenuOpen(false)}>Adgyapan</Link>

                    {/* Desktop Navigation */}
                    <nav className="nav-links desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <SignedIn>
                            <Link href="/explore" className="nav-link" title="Explore"><Compass size={20} /></Link>
                            <Link href="/search" className="nav-link" title="Search"><Search size={20} /></Link>
                            <Link href="/notifications" className="nav-link" title="Notifications"><Bell size={20} /></Link>
                            <Link href="/dashboard" className="nav-link">Dashboard</Link>
                            <Link href="/create" className="btn btn-primary" style={{ height: '2.2rem', padding: '0 1rem' }}>New Campaign</Link>
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
                                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item">
                                    <div className="dot" /> <span>Creator Dashboard</span>
                                </Link>
                            </motion.div>
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

            <main className="main-content" style={{
                flex: 1,
                paddingTop: fullPage ? 0 : '70px',
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
