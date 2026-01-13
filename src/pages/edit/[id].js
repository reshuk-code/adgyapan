
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Zap, Eye, RotateCcw, Maximize, Palette, ChevronRight, Save, Trash2, Crown, Lock, Info, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

const ensureAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export default function EditCampaign() {
    const router = useRouter();
    const { id } = router.query;
    const { isLoaded, userId } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [sub, setSub] = useState({ plan: 'basic', status: 'active' });
    const [isMaximized, setIsMaximized] = useState(false);
    const [imageAR, setImageAR] = useState(1);

    const [form, setForm] = useState({ title: '', category: 'other', image: null, video: null, ctaText: '', ctaUrl: '' });
    const [previews, setPreviews] = useState({ image: null, video: null });
    const [existingUrls, setExistingUrls] = useState({ image: '', video: '', target: '' });

    const [ctaSettings, setCtaSettings] = useState({
        positionX: 0,
        positionY: -0.5,
        scale: 0.15,
        color: '#FFD700',
        borderRadius: 4
    });

    const [overlay, setOverlay] = useState({
        scale: 0.8,
        opacity: 0.9,
        aspectRatio: 1.77,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        positionX: 0,
        positionY: 0
    });

    useEffect(() => {
        if (!id || !isLoaded || !userId) return;

        async function fetchData() {
            try {
                const [adRes, subRes] = await Promise.all([
                    fetch(`/api/ads/${id}`),
                    fetch('/api/subscriptions/me')
                ]);
                const adData = await adRes.json();
                const subData = await subRes.json();

                if (adData.success) {
                    const ad = adData.data;
                    setForm({
                        title: ad.title,
                        category: ad.category || 'other',
                        image: null,
                        video: null,
                        ctaText: ad.ctaText || '',
                        ctaUrl: ad.ctaUrl || ''
                    });
                    setPreviews({ image: ad.imageUrl, video: ad.videoUrl });
                    setExistingUrls({ image: ad.imageUrl, video: ad.videoUrl, target: ad.targetUrl });

                    // Calculate initial imageAR
                    const img = new Image();
                    img.src = ad.imageUrl;
                    img.onload = () => setImageAR(img.width / img.height);

                    if (ad.overlay) {
                        setOverlay({
                            ...overlay,
                            ...ad.overlay,
                            rotationX: ad.overlay.rotationX || 0,
                            rotationY: ad.overlay.rotationY || 0,
                            aspectRatio: ad.overlay.aspectRatio || 1.77
                        });
                    }

                    // Handle Spatial CTA settings (legacy fallback)
                    setCtaSettings({
                        positionX: ad.ctaPositionX !== undefined ? ad.ctaPositionX : 0,
                        positionY: ad.ctaPositionY !== undefined ? ad.ctaPositionY : -0.5,
                        scale: ad.ctaScale !== undefined ? ad.ctaScale : 0.15,
                        color: ad.ctaColor || '#FFD700',
                        borderRadius: ad.ctaBorderRadius !== undefined ? ad.ctaBorderRadius : 4
                    });

                } else {
                    alert('Failed to load ad details');
                    router.push('/dashboard');
                }

                if (subData.success) {
                    setSub(subData.data);
                    const isPro = subData.data.status === 'active' && (subData.data.plan === 'pro' || subData.data.plan === 'enterprise');
                    if (!isPro) {
                        alert('This page is reserved for Pro members only! 🚀');
                        router.push('/dashboard');
                        return;
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, isLoaded, userId]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, [type]: file }));
            const previewUrl = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, [type]: previewUrl }));

            if (type === 'image') {
                const img = new Image();
                img.src = previewUrl;
                img.onload = () => setImageAR(img.width / img.height);
            }

            if (type === 'video') {
                const video = document.createElement('video');
                video.src = previewUrl;
                video.onloadedmetadata = () => {
                    const ar = video.videoWidth / video.videoHeight;
                    setOverlay(prev => ({ ...prev, aspectRatio: ar }));
                };
            }
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
        return uploadData.secure_url;
    };

    const compileImageTarget = async (imageFileOrUrl) => {
        return new Promise((resolve, reject) => {
            if (!window.MINDAR || !window.MINDAR.IMAGE) {
                reject(new Error('MindAR compiler not loaded'));
                return;
            }

            const compiler = new window.MINDAR.IMAGE.Compiler();
            const image = new Image();
            image.crossOrigin = "anonymous";

            if (typeof imageFileOrUrl === 'string') {
                image.src = imageFileOrUrl;
            } else {
                const reader = new FileReader();
                reader.onload = (e) => image.src = e.target.result;
                reader.readAsDataURL(imageFileOrUrl);
            }

            image.onload = async () => {
                try {
                    await compiler.compileImageTargets([image], (progress) => {
                        setUploadStatus(`Processing Geometry... ${Math.round(progress)}%`);
                    });
                    const exportedBuffer = await compiler.exportData();
                    const blob = new Blob([exportedBuffer]);
                    resolve(blob);
                } catch (err) { reject(err); }
            };
            image.onerror = () => reject(new Error("Failed to load image for compilation"));
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setUploadStatus('Syncing changes...');
        try {
            let imageUrl = existingUrls.image;
            let videoUrl = existingUrls.video;
            let targetUrl = existingUrls.target;

            if (form.image) {
                setUploadStatus('Compiling new AR Mindset...');
                const mindBlob = await compileImageTarget(form.image);
                setUploadStatus('Uploading new assets...');
                const [newImg, newTarget] = await Promise.all([
                    uploadToCloudinary(form.image, 'image'),
                    uploadToCloudinary(mindBlob, 'mind')
                ]);
                imageUrl = newImg;
                targetUrl = newTarget;
            }

            if (form.video) {
                setUploadStatus('Uploading new video overlay...');
                videoUrl = await uploadToCloudinary(form.video, 'video');
            }

            setUploadStatus('Finalizing...');
            const res = await fetch(`/api/ads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    category: form.category || 'other',
                    imageUrl,
                    videoUrl,
                    targetUrl,
                    overlay,
                    ctaText: form.ctaText,
                    ctaUrl: ensureAbsoluteUrl(form.ctaUrl),
                    ctaPositionX: ctaSettings.positionX,
                    ctaPositionY: ctaSettings.positionY,
                    ctaScale: ctaSettings.scale,
                    ctaColor: ctaSettings.color,
                    ctaBorderRadius: ctaSettings.borderRadius
                }),
            });

            if (res.ok) router.push('/dashboard');
            else alert('Failed to update campaign');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setSubmitting(false);
            setUploadStatus('');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
            if (res.ok) router.push('/dashboard');
            else alert('Delete failed');
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="container" style={{ marginTop: '10rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1.5rem auto', width: '3rem', height: '3rem' }} />
        <h2 style={{ opacity: 0.5 }}>Synchronizing Spatial Data...</h2>
    </div>;

    return (
        <div style={{ paddingBottom: '8rem' }}>
            <Script src="https://cdn.jsdelivr.net/npm/mind-ar@1.1.5/dist/mindar-image.prod.js" strategy="beforeInteractive" />

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 700 }}>
                        <ArrowLeft size={16} /> Exit Control Center
                    </Link>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleDelete} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Trash2 size={16} /> Scrap Campaign
                        </button>
                    </div>
                </div>
            </div>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '4rem' }}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ marginBottom: '3rem' }}>
                            <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '0.5rem' }}>Edit Realities</h1>
                            <p style={{ color: '#71717a', fontSize: '1.1rem' }}>Refine your spatial parameters and brand interaction.</p>
                        </div>

                        {sub.plan === 'pro' ? (
                            <div className="glass-card" style={{ padding: '2.5rem' }}>
                                <div className="form-group">
                                    <label className="label">Campaign Registry Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        style={{ height: '3.5rem', fontSize: '1.1rem' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                    <div className="form-group">
                                        <label className="label">Category</label>
                                        <select
                                            className="input"
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            style={{ height: '3.5rem' }}
                                        >
                                            <option value="tech">Tech & Innovation</option>
                                            <option value="hospitality">Hospitality</option>
                                            <option value="realestate">Real Estate</option>
                                            <option value="fashion">Fashion & Beauty</option>
                                            <option value="entertainment">Entertainment</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Interactive Button Text</label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="e.g. Visit Store"
                                            value={form.ctaText}
                                            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                            style={{ height: '3.5rem' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">Action URL Destination</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://yourbrand.com/action"
                                            value={form.ctaUrl}
                                            onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                                            style={{ height: '3.5rem', paddingLeft: '1rem' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
                                    <div className="form-group">
                                        <label className="label">Swap Target Image</label>
                                        <label className="input" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', borderStyle: 'dashed', cursor: 'pointer', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                                            <Upload size={24} style={{ marginBottom: '0.75rem', color: '#3b82f6' }} />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{form.image ? form.image.name : 'Choose target'}</span>
                                            <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Swap Video Overlay</label>
                                        <label className="input" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', borderStyle: 'dashed', cursor: 'pointer', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                                            <Zap size={24} style={{ marginBottom: '0.75rem', color: '#f59e0b' }} />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{form.video ? form.video.name : 'Choose video'}</span>
                                            <input type="file" hidden accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '3rem', height: '4.5rem', fontSize: '1.2rem', fontWeight: 900, borderRadius: '16px' }}
                                    disabled={submitting || !form.title}
                                >
                                    {submitting ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="spinner" /> {uploadStatus}
                                        </div>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <Save size={22} /> Commit Changes
                                        </span>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <Crown size={48} className="gold-text" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Editing is a Pro Reality</h2>
                                <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem auto' }}>
                                    Unlock the ability to update assets and refine spatial calibration for existing campaigns.
                                </p>
                                <Link href="/pricing" className="btn btn-primary" style={{ padding: '1rem 3rem' }}>Upgrade to Pro</Link>
                            </div>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <Palette size={20} className="gold-text" /> Calibration Hub
                                </h3>
                                <button
                                    onClick={() => setIsMaximized(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px',
                                        color: '#fff', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700
                                    }}
                                >
                                    <Maximize size={14} /> Maximize
                                </button>
                            </div>

                            <div style={{ background: '#000', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', height: '320px', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {previews.image ? (
                                    <div style={{ position: 'relative', width: imageAR > 1.2 ? '90%' : 'auto', height: imageAR <= 1.2 ? '90%' : 'auto', aspectRatio: `${imageAR}` }}>
                                        <img src={previews.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        {previews.video && (
                                            <div
                                                id="calibration-stage"
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    width: `100%`,
                                                    aspectRatio: `${overlay.aspectRatio}`,
                                                    height: 'auto',
                                                    transform: `
                                                        translate(-50%, -50%) 
                                                        translate(${overlay.positionX * 100}%, ${-overlay.positionY * 100 * imageAR}%) 
                                                        perspective(1000px) 
                                                        rotateX(${overlay.rotationX}deg) 
                                                        rotateY(${overlay.rotationY}deg) 
                                                        rotateZ(${overlay.rotation}deg) 
                                                        scale(${overlay.scale})
                                                    `,
                                                    opacity: overlay.opacity,
                                                    border: '2px solid #FFD700',
                                                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
                                                    pointerEvents: 'none',
                                                    borderRadius: '4px',
                                                    zIndex: 5
                                                }}
                                            >
                                                <video src={previews.video} muted autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                                                {/* Spatial CTA Button */}
                                                {form.ctaText && (
                                                    <motion.div
                                                        drag
                                                        dragMomentum={false}
                                                        onDragEnd={(e, info) => {
                                                            const stage = document.getElementById(isMaximized ? 'maximize-stage' : 'calibration-stage');
                                                            if (!stage) return;
                                                            const rect = stage.getBoundingClientRect();
                                                            const deltaX = info.offset.x / rect.width;
                                                            const deltaY = -info.offset.y / rect.height;

                                                            setCtaSettings(prev => ({
                                                                ...prev,
                                                                positionX: Math.round((prev.positionX + deltaX) * 100) / 100,
                                                                positionY: Math.round((prev.positionY + (deltaY / overlay.aspectRatio)) * 100) / 100
                                                            }));
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            zIndex: 200,
                                                            cursor: 'grab',
                                                            pointerEvents: 'auto',
                                                            x: `${ctaSettings.positionX * 100}%`,
                                                            y: `${-ctaSettings.positionY * 100 * (overlay.aspectRatio)}%`,
                                                            transform: 'translate(-50%, -50%)',
                                                            background: ctaSettings.color || '#FFD700',
                                                            color: '#000',
                                                            padding: '6px 16px',
                                                            borderRadius: `${ctaSettings.borderRadius || 4}px`,
                                                            fontSize: '0.7rem',
                                                            fontWeight: 900,
                                                            whiteSpace: 'nowrap',
                                                            boxShadow: `0 0 20px ${(ctaSettings.color || '#FFD700')}80`,
                                                            border: '2px solid #fff'
                                                        }}
                                                        whileTap={{ cursor: 'grabbing', scale: 1.1 }}
                                                    >
                                                        {form.ctaText}
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3f3f46', gap: '1rem' }}>
                                        <Info size={32} opacity={0.3} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Injecting Realities...</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {[
                                    { label: 'Scale Factor', key: 'scale', min: 0.1, max: 4, step: 0.05, unit: 'x' },
                                    { label: 'Transparency', key: 'opacity', min: 0, max: 1, step: 0.05, unit: '%' },
                                    { label: 'Rotation Z', key: 'rotation', min: -180, max: 180, step: 1, unit: '°' },
                                    { label: 'Rotation X', key: 'rotationX', min: -90, max: 90, step: 1, unit: '°' },
                                    { label: 'Rotation Y', key: 'rotationY', min: -90, max: 90, step: 1, unit: '°' }
                                ].map((ctrl) => (
                                    <div key={ctrl.key} className="form-group" style={{ marginBottom: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <label className="label" style={{ marginBottom: 0 }}>{ctrl.label}</label>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>
                                                {ctrl.key === 'opacity' ? Math.round(overlay[ctrl.key] * 100) : overlay[ctrl.key].toFixed(1)}{ctrl.unit}
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
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isMaximized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="maximize-overlay"
                    >
                        <div className="maximize-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-1px' }}>High-Fidelity Calibration</h2>
                                <div style={{ padding: '4px 12px', background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Precision Tracking Active
                                </div>
                            </div>
                            <button onClick={() => setIsMaximized(false)} className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem', borderRadius: '10px' }}>
                                Exit Precision Mode
                            </button>
                        </div>

                        <div className="maximize-content">
                            <div className="maximize-preview-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {previews.image ? (
                                    <div style={{ position: 'relative', width: imageAR > 1 ? '85%' : 'auto', height: imageAR <= 1 ? '85%' : 'auto', aspectRatio: `${imageAR}` }}>
                                        <img src={previews.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        {previews.video && (
                                            <div
                                                id="maximize-stage"
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    width: `100%`,
                                                    aspectRatio: `${overlay.aspectRatio}`,
                                                    height: 'auto',
                                                    transform: `
                                                        translate(-50%, -50%) 
                                                        translate(${overlay.positionX * 100}%, ${-overlay.positionY * 100 * imageAR}%) 
                                                        perspective(1500px) 
                                                        rotateX(${overlay.rotationX}deg) 
                                                        rotateY(${overlay.rotationY}deg) 
                                                        rotateZ(${overlay.rotation}deg) 
                                                        scale(${overlay.scale})
                                                    `,
                                                    opacity: overlay.opacity,
                                                    border: '4px solid #FFD700',
                                                    boxShadow: '0 0 50px rgba(255, 215, 0, 0.6)',
                                                    pointerEvents: 'none',
                                                    borderRadius: '8px',
                                                    zIndex: 5
                                                }}
                                            >
                                                <video src={previews.video} muted autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {form.ctaText && (
                                                    <motion.div
                                                        drag
                                                        dragMomentum={false}
                                                        onDragEnd={(e, info) => {
                                                            const stage = document.getElementById('maximize-stage');
                                                            if (!stage) return;
                                                            const rect = stage.getBoundingClientRect();
                                                            const deltaX = info.offset.x / rect.width;
                                                            const deltaY = -info.offset.y / rect.height;
                                                            setCtaSettings(prev => ({
                                                                ...prev,
                                                                positionX: Math.round((prev.positionX + deltaX) * 100) / 100,
                                                                positionY: Math.round((prev.positionY + (deltaY / overlay.aspectRatio)) * 100) / 100
                                                            }));
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            zIndex: 500,
                                                            cursor: 'grab',
                                                            pointerEvents: 'auto',
                                                            x: `${ctaSettings.positionX * 100}%`,
                                                            y: `${-ctaSettings.positionY * 100 * (overlay.aspectRatio)}%`,
                                                            transform: 'translate(-50%, -50%)',
                                                            background: ctaSettings.color || '#FFD700',
                                                            color: '#000',
                                                            padding: '10px 30px',
                                                            borderRadius: `${ctaSettings.borderRadius || 4}px`,
                                                            fontSize: '1rem',
                                                            fontWeight: 900,
                                                            whiteSpace: 'nowrap',
                                                            boxShadow: `0 0 40px ${(ctaSettings.color || '#FFD700')}80`,
                                                            border: '2px solid #fff'
                                                        }}
                                                        whileTap={{ cursor: 'grabbing', scale: 1.1 }}
                                                    >
                                                        {form.ctaText}
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ color: '#3f3f46' }}>No Assets to Preview</div>
                                )}
                            </div>

                            <div className="maximize-sidebar">
                                <section style={{ marginBottom: '3rem' }}>
                                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#52525b', letterSpacing: '2px', marginBottom: '1.5rem' }}>CTA Precision</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#52525b', marginBottom: '4px' }}>LATERAL X</div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#FFD700' }}>{ctaSettings.positionX.toFixed(4)}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#52525b', marginBottom: '4px' }}>VERTICAL Y</div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#FFD700' }}>{ctaSettings.positionY.toFixed(4)}</div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Button Scale</label>
                                        <input type="range" className="input-range" min="0.05" max="1" step="0.01" value={ctaSettings.scale} onChange={(e) => setCtaSettings({ ...ctaSettings, scale: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Theme Hex</label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <input type="color" className="input" style={{ width: '60px', padding: '4px', height: '45px' }} value={ctaSettings.color} onChange={(e) => setCtaSettings({ ...ctaSettings, color: e.target.value })} />
                                            <input type="text" className="input" value={ctaSettings.color} onChange={(e) => setCtaSettings({ ...ctaSettings, color: e.target.value })} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: '#52525b', letterSpacing: '2px', marginBottom: '1.5rem' }}>Overlay Controls</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="label">Offset X</label>
                                            <input type="number" step="0.01" className="input" value={overlay.positionX} onChange={(e) => setOverlay({ ...overlay, positionX: parseFloat(e.target.value) })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Offset Y</label>
                                            <input type="number" step="0.01" className="input" value={overlay.positionY} onChange={(e) => setOverlay({ ...overlay, positionY: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        setOverlay(prev => ({ ...prev, positionX: 0, positionY: 0 }));
                                        setCtaSettings(prev => ({ ...prev, positionX: 0, positionY: -0.5 }));
                                    }} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
                                        Reset Position
                                    </button>
                                </section>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
