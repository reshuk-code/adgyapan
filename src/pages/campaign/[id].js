
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import Link from 'next/link';
import { FileEdit } from 'lucide-react';

export default function CampaignDetails() {
    const router = useRouter();
    const { id } = router.query;
    const [ad, setAd] = useState(null);
    const [qrSrc, setQrSrc] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/ads/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAd(data.data);
                    generateQR(data.data.slug);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const generateQR = async (slug) => {
        const url = `${window.location.origin}/ad/${slug}`;
        try {
            const qr = await QRCode.toDataURL(url, { width: 300, margin: 2, dark: '#000000', light: '#ffffff' });
            setQrSrc(qr);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!ad) return <div className="container">Ad not found</div>;

    const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ad/${ad.slug}`;

    return (
        <div className="container">
            <Link href="/dashboard" style={{ marginBottom: '1rem', display: 'inline-block', fontSize: '0.875rem' }}>&larr; Back to Dashboard</Link>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h1 style={{ margin: 0 }}>{ad.title}</h1>
                            <Link href={`/edit/${ad._id}`} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                                <FileEdit size={16} /> Edit Campaign
                            </Link>
                        </div>
                        <p style={{ color: '#71717a' }}>Created on {new Date(ad.createdAt).toLocaleDateString()}</p>

                        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <h1>{ad.viewCount}</h1>
                                <span style={{ color: '#71717a' }}>Total Views</span>
                            </div>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <h1>{ad.hoverCount}</h1>
                                <span style={{ color: '#71717a' }}>Interactions</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <h3>Public URL</h3>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{publicUrl}</a>
                        </div>
                    </div>

                    <div className="card" style={{ minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3>QR Code</h3>
                        {qrSrc && <img src={qrSrc} alt="QR Code" style={{ width: '100%', maxWidth: '250px' }} />}
                        <a href={qrSrc} download={`qr-${ad.slug}.png`} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>Download QR Code</a>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div>
                        <h3>Static Image</h3>
                        <img src={ad.imageUrl} alt="Ad" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <h3>Video Overlay</h3>
                        <video src={ad.videoUrl} controls style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
