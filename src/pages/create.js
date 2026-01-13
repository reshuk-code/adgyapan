
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
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
            <Script src="https://cdn.jsdelivr.net/npm/mind-ar@1.1.5/dist/mindar-image.prod.js" strategy="beforeInteractive" />

            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Dashboard
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
                {/* Form Side */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 style={{ marginBottom: '2.5rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Forge Experience</h1>

                    {(sub.plan === 'basic' && adCount >= 3) ? (
                        <div className="glass-card gold-border" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255, 215, 0, 0.05) 100%)' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 215, 0, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', margin: '0 auto 2rem auto',
                                boxShadow: '0 0 40px rgba(255, 215, 0, 0.2)'
                            }}>
                                <Crown size={40} />
                            </div>
                            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }} className="gold-text">Elite Workspace</h2>
                            <p style={{ color: '#a1a1aa', marginBottom: '3rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                You've reached the capacity of our basic engine. <br />
                                <strong style={{ color: 'white' }}>Upgrade to Pro</strong> to unlock unlimited campaigns and advanced AR storytelling.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem', textAlign: 'left' }}>
                                {[
                                    { icon: <PlusCircle size={18} />, text: 'Unlimited Slots' },
                                    { icon: <Zap size={18} />, text: 'High Priority' },
                                    { icon: <ShieldCheck size={18} />, text: 'No Brand Watermark' },
                                    { icon: <BarChart2 size={18} />, text: 'Deep Stats' }
                                ].map((feat, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{ color: '#10b981' }}>{feat.icon}</div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{feat.text}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href="/pricing" className="btn btn-primary" style={{ width: '100%', height: '4rem', fontSize: '1.2rem', background: '#fff', color: '#000' }}>
                                Unlock Pro Access &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '2.5rem' }}>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="label">Project Identity</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Neo-Tokyo Billboard"
                                    value={form.title}
                                    style={{ fontSize: '1.1rem', padding: '1.25rem' }}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <label className="label" style={{ marginBottom: 0 }}>Content Category</label>
                                    {sub.plan !== 'pro' && (
                                        <Link href="/pricing" className="gold-text" style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <Lock size={10} style={{ marginRight: '4px' }} /> Pro Only
                                        </Link>
                                    )}
                                </div>
                                <select
                                    className="input"
                                    value={form.category || 'other'}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    disabled={sub.plan !== 'pro'}
                                    style={{
                                        background: '#0a0a0a',
                                        cursor: sub.plan === 'pro' ? 'pointer' : 'not-allowed',
                                        opacity: sub.plan === 'pro' ? 1 : 0.6
                                    }}
                                >
                                    <option value="tech">Innovation</option>
                                    <option value="luxury">Luxury & Style</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="education">Educational</option>
                                    <option value="other">Universal</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <div className="form-group">
                                    <label className="label">AR Target</label>
                                    <label className="input" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                        <Maximize size={24} style={{ marginBottom: '0.75rem', color: '#3b82f6' }} />
                                        <span style={{ fontSize: '0.75rem', textAlign: 'center', opacity: 0.6 }}>{form.image ? form.image.name : 'Target Image'}</span>
                                        <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label className="label">AR Overlay</label>
                                    <label className="input" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                        <Zap size={24} style={{ marginBottom: '0.75rem', color: '#FFD700' }} />
                                        <span style={{ fontSize: '0.75rem', textAlign: 'center', opacity: 0.6 }}>{form.video ? form.video.name : 'Experience Video'}</span>
                                        <input type="file" hidden accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                                    </label>
                                </div>
                            </div>

                            {sub.plan === 'pro' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                    <div className="form-group">
                                        <label className="label">CTA Label</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Buy Now"
                                            value={form.ctaText}
                                            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Link URL</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://..."
                                            value={form.ctaUrl}
                                            onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                className="btn btn-primary"
                                style={{ width: '100%', height: '4rem', fontSize: '1.1rem', fontWeight: 800 }}
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

                {/* Calibration Side */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Palette size={20} className="gold-text" /> Calibration Hub
                        </h3>

                        <div style={{ background: '#000', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', height: '320px', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' }}>
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
                                            border: '2px solid #FFD700',
                                            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
                                            pointerEvents: 'none',
                                            borderRadius: '4px'
                                        }}>
                                            <video src={previews.video} muted autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3f3f46', gap: '1rem' }}>
                                    <Info size={32} opacity={0.3} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Awaiting assets...</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                { label: 'Scale Factor', key: 'scale', min: 0.1, max: 2, step: 0.1, unit: 'x' },
                                { label: 'Opacity Alpha', key: 'opacity', min: 0, max: 1, step: 0.1, unit: '%' },
                                { label: 'Rotation Euler', key: 'rotation', min: 0, max: 360, step: 1, unit: '°' }
                            ].map((ctrl) => (
                                <div key={ctrl.key} className="form-group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <label className="label" style={{ marginBottom: 0 }}>{ctrl.label}</label>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>
                                            {ctrl.key === 'opacity' ? Math.round(overlay[ctrl.key] * 100) : overlay[ctrl.key].toFixed(ctrl.key === 'rotation' ? 0 : 1)}{ctrl.unit}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        className="input-range"
                                        min={ctrl.min}
                                        max={ctrl.max}
                                        step={ctrl.step}
                                        value={overlay[ctrl.key]}
                                        onChange={(e) => setOverlay({ ...overlay, [ctrl.key]: parseFloat(e.target.value) })}
                                    />
                                </div>
                            ))}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="label">Spatial X</label>
                                    <input type="number" className="input" step="0.05" value={overlay.positionX} onChange={(e) => setOverlay({ ...overlay, positionX: parseFloat(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="label">Spatial Y</label>
                                    <input type="number" className="input" step="0.05" value={overlay.positionY} onChange={(e) => setOverlay({ ...overlay, positionY: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .input-range {
                    width: 100%;
                    -webkit-appearance: none;
                    background: rgba(255,255,255,0.05);
                    height: 6px;
                    border-radius: 10px;
                    outline: none;
                }
                .input-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #fff;
                    border: 4px solid #000;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    transition: transform 0.1s;
                }
                .input-range::-webkit-slider-thumb:active {
                    transform: scale(1.2);
                }
                .spinner {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top: 3px solid #FFD700;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
