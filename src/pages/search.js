
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search as SearchIcon, ArrowLeft, User, BadgeCheck } from 'lucide-react';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query) handleSearch();
            else setResults([]);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/search?q=${query}`);
            const json = await res.json();
            if (json.success) setResults(json.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: 'white' }}>
            <Head>
                <title>Search Creators | Adgyapan</title>
            </Head>

            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem', maxWidth: '600px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem' }}>
                    <ArrowLeft size={18} /> Back to Feed
                </Link>

                <div style={{ position: 'relative', marginBottom: '3rem' }}>
                    <SearchIcon style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search for creators..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '12px',
                            padding: '1rem 1rem 1rem 3rem',
                            color: 'white',
                            fontSize: '1.1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Searching...</div>
                ) : results.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {results.map((user, i) => (
                            <motion.div
                                key={user.userId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={`/profile/${user.userId}`} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: '#09090b',
                                    borderRadius: '16px',
                                    border: '1px solid #18181b',
                                    transition: 'background 0.2s'
                                }}>
                                    <img src={user.avatar} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <h4 style={{ margin: 0, fontWeight: '800' }}>{user.userName}</h4>
                                            {/* We could hydrate plan here too but it might be overkill for search results initially */}
                                        </div>
                                        <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.85rem', fontWeight: '700' }}>@{user.userName.toLowerCase().replace(/\s/g, '')}</p>
                                    </div>
                                    <div style={{ color: '#a1a1aa' }}>
                                        <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : query && !loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#52525b' }}>
                        No results found for "{query}"
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#52525b' }}>
                        <SearchIcon size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
                        <p>Search by name or username</p>
                    </div>
                )}
            </div>
        </div>
    );
}
