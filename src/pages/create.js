
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Zap, Eye, RotateCcw, Maximize, Palette, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Crown, Lock, Info, PlusCircle } from 'lucide-react';

const ensureAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export default function CreateCampaign() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingSub, setFetchingSub] = useState(true);
    const [sub, setSub] = useState({ plan: 'basic', status: 'active' });
    const [adCount, setAdCount] = useState(0);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ title: '', category: 'other', image: null, video: null, ctaText: '', ctaUrl: '' });
    const [previews, setPreviews] = useState({ image: null, video: null });
    const [uploadStatus, setUploadStatus] = useState('');

    useEffect(() => {
        async function checkStatus() {
            try {
                const [subRes, adsRes] = await Promise.all([
                    fetch('/api/subscriptions/me'),
                    fetch('/api/ads')
                ]);
                const subData = await subRes.json();
                const adsData = await adsRes.json();
                if (subData.success) setSub(subData.data);
                if (adsData.success) setAdCount(adsData.data.length);
            } catch (err) { console.error(err); }
            finally { setFetchingSub(false); }
        }
        checkStatus();
    }, []);

    const [overlay, setOverlay] = useState({
        scale: 0.8,
        opacity: 0.9,
        rotation: 0,
        positionX: 0,
        positionY: 0
    });

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
        }
    };

    const uploadToCloudinary = async (file, type) => {
        const signRes = await fetch('/api/sign-cloudinary');
        const signData = await signRes.json();
        if (signRes.status !== 200) throw new Error('Failed to get signature');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.api_key);
        formData.append('timestamp', signData.timestamp);
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const resourceType = type === 'mind' ? 'raw' : (type === 'video' ? 'video' : 'image');

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/${resourceType}/upload`, {
            method: 'POST', body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Upload failed');
        return uploadData.secure_url;
    };

    const compileImageTarget = async (imageFile) => {
        return new Promise((resolve, reject) => {
            if (!window.MINDAR || !window.MINDAR.IMAGE) {
                reject(new Error('MindAR compiler not loaded'));
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const compiler = new window.MINDAR.IMAGE.Compiler();
                    const image = new Image();
                    image.src = e.target.result;
                    image.onload = async () => {
                        await compiler.compileImageTargets([image], (progress) => {
                            setUploadStatus(`Processing Geometry... ${Math.round(progress)}%`);
                        });
                        const exportedBuffer = await compiler.exportData();
                        const blob = new Blob([exportedBuffer]);
                        resolve(blob);
                    };
                } catch (err) { reject(err); }
            };
            reader.readAsDataURL(imageFile);
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setUploadStatus('Initializing...');
        try {
            setUploadStatus('Compiling AR Mindset...');
            const mindBlob = await compileImageTarget(form.image);

            setUploadStatus('Synchronizing Media...');
            const [imageUrl, videoUrl, targetUrl] = await Promise.all([
                uploadToCloudinary(form.image, 'image'),
                uploadToCloudinary(form.video, 'video'),
                uploadToCloudinary(mindBlob, 'mind')
            ]);

            setUploadStatus('Finalizing Workspace...');
            const res = await fetch('/api/ads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    category: form.category || 'other',
                    imageUrl,
                    videoUrl,
                    targetUrl,
                    overlay,
                    ctaText: form.ctaText,
                    ctaUrl: ensureAbsoluteUrl(form.ctaUrl)
                }),
            });

            if (res.ok) router.push('/dashboard');
            else {
                const err = await res.json();
                throw new Error(err.error || 'Creation failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    return (
        <div className="container" style={{ marginTop: '3rem', paddingBottom: '5rem' }}>
            <Script src="https://cdn.jsdelivr.net/npm/mind-ar@1.1.5/dist/mindar-image.prod.js" strategy="beforeInteractive" />

            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1>Create AR Experience</h1>

                    {(sub.plan === 'basic' && adCount >= 3) ? (
                        <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', border: '2px solid rgba(245, 158, 11, 0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(245, 158, 11, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', margin: '0 auto 2rem auto',
                                boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)'
                            }}>
                                <Crown size={40} />
                            </div>
                            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Join the Pro Revolution!</h2>
                            <p style={{ color: '#a1a1aa', marginBottom: '3rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                You've reached the limit of 3 campaigns on the Basic plan. <br />
                                <span style={{ color: 'white', fontWeight: 700 }}>Unlock unlimited storytelling</span> and massive reach today.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem', textAlign: 'left' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ color: '#10b981' }}><PlusCircle size={18} /></div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Unlimited Campaigns</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ color: '#10b981' }}><PlusCircle size={18} /></div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Genre Categories</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ color: '#10b981' }}><PlusCircle size={18} /></div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Priority Verification</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ color: '#10b981' }}><PlusCircle size={18} /></div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Advanced Stats</span>
                                </div>
                            </div>

                            <Link href="/pricing" className="btn btn-primary" style={{ width: '100%', height: '4rem', fontSize: '1.2rem', fontWeight: 1000, boxShadow: '0 10px 40px rgba(254, 44, 85, 0.4)' }}>
                                Upgrade to Pro Now &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div className="form-group">
                                <label className="label">Campaign Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Cyberpunk 2077 Release"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <label className="label" style={{ marginBottom: 0 }}>Category / Genre</label>
                                    {sub.plan !== 'pro' && (
                                        <Link href="/pricing" style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            <Crown size={10} /> Pro Feature
                                        </Link>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="input"
                                        value={form.category || 'other'}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        disabled={sub.plan !== 'pro'}
                                        style={{
                                            background: '#18181b',
                                            color: sub.plan === 'pro' ? 'white' : '#71717a',
                                            opacity: sub.plan === 'pro' ? 1 : 0.7,
                                            cursor: sub.plan === 'pro' ? 'pointer' : 'not-allowed',
                                            paddingRight: '2.5rem'
                                        }}
                                    >
                                        <option value="tech">Tech & Innovation</option>
                                        <option value="comedy">Comedy & Fun</option>
                                        <option value="drama">Drama & Story</option>
                                        <option value="lifestyle">Lifestyle</option>
                                        <option value="fashion">Fashion & Beauty</option>
                                        <option value="education">Education</option>
                                        <option value="entertainment">Entertainment</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {sub.plan !== 'pro' && (
                                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}>
                                            <Lock size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {sub.plan === 'pro' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label className="label">CTA Button Text (Optional)</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="e.g. Visit Shop"
                                            maxLength={20}
                                            value={form.ctaText}
                                            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Destination URL</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://example.com"
                                            value={form.ctaUrl}
                                            onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Crown size={18} style={{ color: '#f59e0b' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Interactive CTAs are a Pro feature</span>
                                    </div>
                                    <Link href="/pricing" style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 900, textTransform: 'uppercase' }}>Upgrade &rarr;</Link>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="label">Static Target Image</label>
                                    <label className="input" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '2.5rem 1rem',
                                        borderStyle: 'dashed',
                                        cursor: 'pointer'
                                    }}>
                                        <Upload size={24} style={{ marginBottom: '0.5rem', color: '#3b82f6' }} />
                                        <span style={{ fontSize: '0.8rem' }}>{form.image ? form.image.name : 'Choose Image'}</span>
                                        <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label className="label">AR Video Overlay</label>
                                    <label className="input" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '2.5rem 1rem',
                                        borderStyle: 'dashed',
                                        cursor: 'pointer'
                                    }}>
                                        <Zap size={24} style={{ marginBottom: '0.5rem', color: '#f59e0b' }} />
                                        <span style={{ fontSize: '0.8rem' }}>{form.video ? form.video.name : 'Choose Video'}</span>
                                        <input type="file" hidden accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1rem', height: '3.5rem' }}
                                disabled={loading || !form.title || !form.image || !form.video}
                            >
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="spinner" /> {uploadStatus}
                                    </div>
                                ) : 'Launch Experience'}
                            </button>
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Palette size={20} /> Live Calibration
                        </h3>

                        <div style={{ background: '#000', borderRadius: '1rem', overflow: 'hidden', position: 'relative', height: '280px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {previews.image ? (
                                <>
                                    <img src={previews.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    {previews.video && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            width: '60%',
                                            height: '40%',
                                            transform: `translate(-50%, -50%) translate(${overlay.positionX * 100}%, ${-overlay.positionY * 100}%) rotate(${overlay.rotation}deg) scale(${overlay.scale})`,
                                            opacity: overlay.opacity,
                                            border: '1px solid #3b82f6',
                                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)',
                                            pointerEvents: 'none'
                                        }}>
                                            <video src={previews.video} muted autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3f3f46' }}>
                                    Preview Unavailable
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label className="label">Scale</label>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{overlay.scale.toFixed(1)}x</span>
                            </div>
                            <input type="range" className="input-range" min="0.1" max="2" step="0.1" value={overlay.scale} onChange={(e) => setOverlay({ ...overlay, scale: parseFloat(e.target.value) })} />
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label className="label">Transparency</label>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{Math.round(overlay.opacity * 100)}%</span>
                            </div>
                            <input type="range" className="input-range" min="0" max="1" step="0.1" value={overlay.opacity} onChange={(e) => setOverlay({ ...overlay, opacity: parseFloat(e.target.value) })} />
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label className="label">Orientation</label>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{overlay.rotation}°</span>
                            </div>
                            <input type="range" className="input-range" min="0" max="360" step="1" value={overlay.rotation} onChange={(e) => setOverlay({ ...overlay, rotation: parseInt(e.target.value) })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="label">Offset X</label>
                                <input type="number" className="input" step="0.05" value={overlay.positionX} onChange={(e) => setOverlay({ ...overlay, positionX: parseFloat(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Offset Y</label>
                                <input type="number" className="input" step="0.05" value={overlay.positionY} onChange={(e) => setOverlay({ ...overlay, positionY: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
            .input-range {
                width: 100%;
                -webkit-appearance: none;
                background: rgba(255,255,255,0.1);
                height: 4px;
                border-radius: 2px;
                outline: none;
            }
            .input-range::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: #fff;
                border-radius: 50%;
                cursor: pointer;
            }
            .spinner {
                width: 1rem;
                height: 1rem;
                border: 2px solid rgba(0,0,0,0.1);
                border-top: 2px solid #000;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        </div>
    );
}
