import { useState } from 'react';
import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Search, Bell, Compass, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Layout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="layout">
            <header className="navbar">
                <div className="container navbar-content">
                    <Link href="/" className="logo">Adgyapan</Link>

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

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="mobile-overlay"
                        />
                        <motion.nav
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="mobile-menu"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div className="logo" style={{ fontSize: '1.25rem' }}>Menu</div>
                                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <SignedIn>
                                <Link href="/explore" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none' }}>
                                    <Compass size={20} /> Explore
                                </Link>
                                <Link href="/search" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none' }}>
                                    <Search size={20} /> Search
                                </Link>
                                <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none' }}>
                                    <Bell size={20} /> Notifications
                                </Link>
                                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none' }}>
                                    Dashboard
                                </Link>
                                <Link href="/create" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    New Campaign
                                </Link>
                                <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </SignedIn>
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
                                </SignInButton>
                            </SignedOut>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>

            <main className="main-content" style={{ flex: 1, paddingTop: '4rem', paddingBottom: '4rem' }}>
                {children}
            </main>
            <footer className="footer" style={{ borderTop: '1px solid var(--border)', padding: '4rem 0', opacity: 0.5 }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="logo" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Adgyapan</div>
                    <p style={{ fontSize: '0.8rem' }}>© {new Date().getFullYear()} Interactive AR Advertising Platform.</p>
                </div>
            </footer>

            <style jsx>{`
                .mobile-menu-btn {
                    display: none;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    borderRadius: 8px;
                    padding: 0.5rem;
                    cursor: pointer;
                    color: white;
                }

                .mobile-overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 998;
                }

                .mobile-menu {
                    display: none;
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 280px;
                    background: rgba(0,0,0,0.95);
                    backdrop-filter: blur(20px);
                    border-left: 1px solid rgba(255,255,255,0.1);
                    z-index: 999;
                    padding: 2rem 1.5rem;
                    flex-direction: column;
                    gap: 1.5rem;
                    overflow-y: auto;
                }

                @media (max-width: 768px) {
                    .desktop-nav {
                        display: none !important;
                    }
                    .mobile-menu-btn {
                        display: block !important;
                    }
                    .mobile-menu {
                        display: flex !important;
                    }
                    .mobile-overlay {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}
