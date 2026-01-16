
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Zap, Eye, RotateCcw, Maximize, Palette, ChevronRight, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { Crown, Lock, Info, PlusCircle, LayoutGrid, Sparkles, Box, Wind, Moon } from 'lucide-react';
import { INDUSTRY_TEMPLATES } from '@/components/IndustryTemplates';

const AR_PRESETS = [
    { id: 'standard', name: 'Standard', icon: <Box size={14} />, description: 'Clean overlay.' },
    { id: 'glass', name: 'Glass', icon: <Sparkles size={14} />, description: 'Translucent blur.' },
    { id: 'neon', name: 'Neon', icon: <Zap size={14} />, description: 'Glow borders.' },
    { id: 'frosted', name: 'Frost', icon: <Wind size={14} />, description: 'Icy texture.' }
];

const AR_BEHAVIORS = [
    { id: 'static', name: 'Static', description: 'Locked 3D.' },
    { id: 'float', name: 'Float', description: 'Wave motion.' },
    { id: 'pulse', name: 'Pulse', description: 'Breathing.' },
    { id: 'glitch', name: 'Glitch', description: 'Digital bugs.' }
];

const AR_ENVIRONMENTS = [
    { id: 'studio', name: 'Studio', description: 'Neutral.' },
    { id: 'outdoor', name: 'Outdoor', description: 'Warm.' },
    { id: 'night', name: 'Night', description: 'Cool.' },
    { id: 'cyberpunk', name: 'Cyber', description: 'High energy.' }
];

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
    const [form, setForm] = useState({ title: '', category: 'other', image: null, video: null, ctaText: '', ctaUrl: '', ctaType: 'link', leadFormFields: [], leadWebhook: '' });
    const [previews, setPreviews] = useState({ image: null, video: null });
    const [uploadStatus, setUploadStatus] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const [isPersistent, setIsPersistent] = useState(false);
    const [imageAR, setImageAR] = useState(1); // Default 1:1
    const [ctaSettings, setCtaSettings] = useState({
        positionX: 0,
        positionY: -0.5,
        scale: 0.15,
        color: '#FFD700',
        borderRadius: 4
    });
    const [mounted, setMounted] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    // Chroma Key State
    const [chromaKey, setChromaKey] = useState({
        enabled: false,
        color: '#00FF00',
        threshold: 0.4
    });
    // Multiple CTA Buttons State
    const [ctaButtons, setCtaButtons] = useState([]);
    const [showCtaButtons, setShowCtaButtons] = useState(true);


    useEffect(() => {
        setMounted(true);
    }, []);

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
        aspectRatio: 1.777,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        positionX: 0,
        positionY: 0,
        preset: 'standard',
        behavior: 'float',
        environment: 'studio',
        showQR: true
    });

    const handleIndustrySelect = (industry) => {
        setSelectedIndustry(industry.id);
        setOverlay(prev => ({ ...prev, ...industry.preset }));
        setForm(prev => ({ ...prev, category: industry.id }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, [type]: file }));
            const previewUrl = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, [type]: previewUrl }));

            if (type === 'image') {
                const img = new Image();
                img.src = previewUrl;
                img.onload = () => {
                    setImageAR(img.width / img.height);
                };
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
                    isPersistent,
                    ctaPositionX: ctaSettings.positionX,
                    ctaPositionY: ctaSettings.positionY,
                    ctaScale: ctaSettings.scale,
                    ctaColor: ctaSettings.color,
                    ctaBorderRadius: ctaSettings.borderRadius,
                    overlay: {
                        ...overlay,
                        // Ensure defaults if missing
                        preset: overlay.preset || 'standard',
                        behavior: overlay.behavior || 'float',
                        environment: overlay.environment || 'studio',
                        showQR: overlay.showQR ?? true
                    },
                    ctaText: form.ctaText,
                    ctaUrl: form.ctaType === 'link' ? ensureAbsoluteUrl(form.ctaUrl) : form.ctaUrl,
                    ctaType: form.ctaType,
                    leadFormFields: form.leadFormFields,
                    leadWebhook: form.leadWebhook,
                    // Chroma Key
                    chromaKeyEnabled: chromaKey.enabled,
                    chromaKeyColor: chromaKey.color,
                    chromaKeyThreshold: chromaKey.threshold,
                    // Multiple CTA Buttons
                    ctaButtons: ctaButtons,
                    showCtaButtons: showCtaButtons
                }),
            });

            if (res.ok) {
                const result = await res.json();
                setUploadStatus('Warping to Experience...');
                setTimeout(() => {
                    router.push('/ad/' + result.data.slug);
                }, 1000);
            } else {
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

    if (!mounted) return null;

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
            <Script src="https://cdn.jsdelivr.net/npm/mind-ar@1.1.5/dist/mindar-image.prod.js" strategy="beforeInteractive" />

            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Dashboard
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
                {/* Form Side */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 style={{ marginBottom: '1.5rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Forge Experience</h1>

                    {!selectedIndustry && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card gold-border" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <LayoutGrid size={20} style={{ color: 'rgba(255,255,255,0.9)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Choose Industry Template</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                {INDUSTRY_TEMPLATES.map((ind) => (
                                    <button
                                        key={ind.id}
                                        onClick={() => handleIndustrySelect(ind)}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            padding: '1.25rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            color: '#fff'
                                        }}
                                        className="hover-lift"
                                    >
                                        <div style={{ color: '#FFD700', marginBottom: '0.75rem' }}>{ind.icon}</div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem', color: '#fff' }}>{ind.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{ind.description}</div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

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

                            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Tracking Persistence</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Keep AR visible even when camera target is lost.</div>
                                    </div>
                                    <button
                                        onClick={() => setIsPersistent(!isPersistent)}
                                        style={{
                                            width: '50px', height: '26px', borderRadius: '13px',
                                            background: isPersistent ? '#FFD700' : 'rgba(255,255,255,0.1)',
                                            position: 'relative', transition: 'all 0.3s', border: 'none', cursor: 'pointer'
                                        }}
                                    >
                                        <motion.div
                                            animate={{ x: isPersistent ? 24 : 0 }}
                                            style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                        />
                                    </button>
                                </div>
                            </div>

                            {sub.plan === 'pro' && (
                                <>
                                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.1)' }}>
                                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Zap size={18} className="gold-text" /> Call-To-Action Configuration
                                        </h4>

                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="label">CTA Type</label>
                                            <select
                                                className="input"
                                                value={form.ctaType}
                                                onChange={(e) => setForm({ ...form, ctaType: e.target.value, leadFormFields: e.target.value === 'lead_form' ? ['name', 'email'] : [] })}
                                                style={{ background: '#0a0a0a', cursor: 'pointer' }}
                                            >
                                                <option value="link">External Link</option>
                                                <option value="lead_form">Lead Capture Form</option>
                                                <option value="phone">Quick Call</option>
                                                <option value="email">Quick Email</option>
                                            </select>
                                            <p style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.5rem' }}>
                                                {form.ctaType === 'link' && 'Opens an external website in a new tab'}
                                                {form.ctaType === 'lead_form' && 'Captures user information directly in AR'}
                                                {form.ctaType === 'phone' && 'Initiates a phone call (mobile devices)'}
                                                {form.ctaType === 'email' && 'Opens email client with pre-filled address'}
                                            </p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="label">Button Label</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder={form.ctaType === 'lead_form' ? 'Contact Us' : form.ctaType === 'phone' ? 'Call Now' : form.ctaType === 'email' ? 'Email Us' : 'Learn More'}
                                                    value={form.ctaText}
                                                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="label">
                                                    {form.ctaType === 'phone' ? 'Phone Number' : form.ctaType === 'email' ? 'Email Address' : form.ctaType === 'link' ? 'Destination URL' : 'Webhook URL (Optional)'}
                                                </label>
                                                <input
                                                    type={form.ctaType === 'email' ? 'email' : form.ctaType === 'phone' ? 'tel' : 'url'}
                                                    className="input"
                                                    placeholder={form.ctaType === 'phone' ? '+977...' : form.ctaType === 'email' ? 'contact@...' : form.ctaType === 'link' ? 'https://...' : 'https://webhook.site/...'}
                                                    value={form.ctaType === 'lead_form' ? form.leadWebhook : form.ctaUrl}
                                                    onChange={(e) => form.ctaType === 'lead_form' ? setForm({ ...form, leadWebhook: e.target.value }) : setForm({ ...form, ctaUrl: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {form.ctaType === 'lead_form' && (
                                            <div className="form-group">
                                                <label className="label" style={{ marginBottom: '1rem' }}>Form Fields to Capture</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                                    {['name', 'email', 'phone', 'company', 'message'].map(field => (
                                                        <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', background: form.leadFormFields.includes(field) ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${form.leadFormFields.includes(field) ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '12px', transition: 'all 0.2s' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={form.leadFormFields.includes(field)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setForm({ ...form, leadFormFields: [...form.leadFormFields, field] });
                                                                    } else {
                                                                        setForm({ ...form, leadFormFields: form.leadFormFields.filter(f => f !== field) });
                                                                    }
                                                                }}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'capitalize' }}>{field}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <p style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '1rem' }}>
                                                    Select which information to collect from users. Name and Email are recommended.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chroma Key Configuration */}
                                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
                                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Sparkles size={18} style={{ color: '#3b82f6' }} /> Chroma Key (Transparency)
                                        </h4>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Enable Transparent Background</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Remove solid color backgrounds from your video</div>
                                            </div>
                                            <button
                                                onClick={() => setChromaKey({ ...chromaKey, enabled: !chromaKey.enabled })}
                                                style={{
                                                    width: '50px', height: '26px', borderRadius: '13px',
                                                    background: chromaKey.enabled ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                                    position: 'relative', transition: 'all 0.3s', border: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                <motion.div
                                                    animate={{ x: chromaKey.enabled ? 24 : 0 }}
                                                    style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                                />
                                            </button>
                                        </div>

                                        {chromaKey.enabled && (
                                            <>
                                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                    <label className="label">Chroma Key Color</label>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <input
                                                            type="color"
                                                            value={chromaKey.color}
                                                            onChange={(e) => setChromaKey({ ...chromaKey, color: e.target.value })}
                                                            style={{ width: '60px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            value={chromaKey.color}
                                                            onChange={(e) => setChromaKey({ ...chromaKey, color: e.target.value })}
                                                            style={{ flex: 1 }}
                                                        />
                                                    </div>
                                                    <p style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.5rem' }}>
                                                        Select the color to make transparent (usually green #00FF00)
                                                    </p>
                                                </div>

                                                <div className="form-group">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                        <label className="label" style={{ marginBottom: 0 }}>Threshold Sensitivity</label>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'white' }}>
                                                            {(chromaKey.threshold * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        className="input-range"
                                                        min="0.1"
                                                        max="1.0"
                                                        step="0.05"
                                                        value={chromaKey.threshold}
                                                        onChange={(e) => setChromaKey({ ...chromaKey, threshold: parseFloat(e.target.value) })}
                                                    />
                                                    <p style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.5rem' }}>
                                                        Higher values remove more similar colors
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Multiple CTA Buttons */}
                                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <PlusCircle size={18} style={{ color: '#10b981' }} /> Multiple CTA Buttons
                                            </h4>
                                            <button
                                                onClick={() => setShowCtaButtons(!showCtaButtons)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: showCtaButtons ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${showCtaButtons ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: '8px',
                                                    color: showCtaButtons ? '#10b981' : '#71717a',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {showCtaButtons ? 'Visible' : 'Hidden'}
                                            </button>
                                        </div>

                                        {ctaButtons.length < 5 && (
                                            <button
                                                onClick={() => {
                                                    setCtaButtons([...ctaButtons, {
                                                        text: 'Button ' + (ctaButtons.length + 1),
                                                        url: '',
                                                        type: 'link',
                                                        positionX: 0,
                                                        positionY: -0.5 - (ctaButtons.length * 0.2),
                                                        scale: 0.15,
                                                        color: '#FFD700',
                                                        borderRadius: 4
                                                    }]);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '1rem',
                                                    background: 'rgba(16,185,129,0.1)',
                                                    border: '1px dashed rgba(16,185,129,0.3)',
                                                    borderRadius: '12px',
                                                    color: '#10b981',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    marginBottom: '1.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <PlusCircle size={18} /> Add CTA Button ({ctaButtons.length}/5)
                                            </button>
                                        )}

                                        {ctaButtons.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {ctaButtons.map((button, index) => (
                                                    <div key={index} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                            <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Button {index + 1}</h5>
                                                            <button
                                                                onClick={() => setCtaButtons(ctaButtons.filter((_, i) => i !== index))}
                                                                style={{
                                                                    background: 'rgba(239,68,68,0.1)',
                                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                                    color: '#ef4444',
                                                                    padding: '0.25rem 0.75rem',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                                <label className="label" style={{ fontSize: '0.7rem' }}>Button Text</label>
                                                                <input
                                                                    type="text"
                                                                    className="input"
                                                                    value={button.text}
                                                                    onChange={(e) => {
                                                                        const newButtons = [...ctaButtons];
                                                                        newButtons[index].text = e.target.value;
                                                                        setCtaButtons(newButtons);
                                                                    }}
                                                                    style={{ height: '2.5rem', fontSize: '0.8rem' }}
                                                                />
                                                            </div>
                                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                                <label className="label" style={{ fontSize: '0.7rem' }}>Button URL</label>
                                                                <input
                                                                    type="url"
                                                                    className="input"
                                                                    value={button.url}
                                                                    onChange={(e) => {
                                                                        const newButtons = [...ctaButtons];
                                                                        newButtons[index].url = e.target.value;
                                                                        setCtaButtons(newButtons);
                                                                    }}
                                                                    style={{ height: '2.5rem', fontSize: '0.8rem' }}
                                                                    placeholder="https://..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {ctaButtons.length === 0 && (
                                            <p style={{ textAlign: 'center', color: '#71717a', fontSize: '0.85rem', padding: '2rem 0' }}>
                                                No CTA buttons added yet. Click above to add your first button.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}


                            <button
                                onClick={handleSubmit}
                                className="premium-button"
                                style={{ width: '100%', height: '4rem', fontSize: '1.2rem', borderRadius: '16px' }}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Awaiting assets...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                        {[
                            { label: 'Scale Factor', key: 'scale', min: 0.1, max: 4, step: 0.05, unit: 'x' },
                            { label: 'Aspect Ratio', key: 'aspectRatio', min: 0.1, max: 3, step: 0.01, unit: ':1' },
                            { label: 'Opacity Alpha', key: 'opacity', min: 0, max: 1, step: 0.05, unit: '%' },
                            { label: 'Rotation Z', key: 'rotation', min: -180, max: 180, step: 1, unit: '°' },
                            { label: 'Rotation X', key: 'rotationX', min: -90, max: 90, step: 1, unit: '°' },
                            { label: 'Rotation Y', key: 'rotationY', min: -90, max: 90, step: 1, unit: '°' }
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

                    {/* AR Creative Studio */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Sparkles size={18} className="gold-text" /> AR Creative Studio
                        </h4>

                        {/* Preset Selection */}
                        <div className="form-group">
                            <label className="label" style={{ fontSize: '0.75rem' }}>Frame Overlay Preset</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                {AR_PRESETS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setOverlay({ ...overlay, preset: p.id })}
                                        style={{
                                            padding: '12px 6px',
                                            background: overlay.preset === p.id ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${overlay.preset === p.id ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '12px',
                                            color: overlay.preset === p.id ? '#FFD700' : '#888',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {p.icon}
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Behavior Selection */}
                        <div className="form-group">
                            <label className="label" style={{ fontSize: '0.75rem' }}>Animation Behavior</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {AR_BEHAVIORS.map((b) => (
                                    <button
                                        key={b.id}
                                        onClick={() => setOverlay({ ...overlay, behavior: b.id })}
                                        style={{
                                            padding: '12px',
                                            textAlign: 'left',
                                            background: overlay.behavior === b.id ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${overlay.behavior === b.id ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '12px',
                                            color: overlay.behavior === b.id ? '#fff' : '#888',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: overlay.behavior === b.id ? '#FFD700' : '#fff' }}>{b.name}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{b.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Environment Selection */}
                        <div className="form-group">
                            <label className="label" style={{ fontSize: '0.75rem' }}>Lighting Environment</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {AR_ENVIRONMENTS.map((e) => (
                                    <button
                                        key={e.id}
                                        onClick={() => setOverlay({ ...overlay, environment: e.id })}
                                        style={{
                                            padding: '12px',
                                            textAlign: 'left',
                                            background: overlay.environment === e.id ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${overlay.environment === e.id ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '12px',
                                            color: overlay.environment === e.id ? '#fff' : '#888',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: overlay.environment === e.id ? '#FFD700' : '#fff' }}>{e.name}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{e.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Options */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <input
                                type="checkbox"
                                checked={overlay.showQR}
                                onChange={(e) => setOverlay({ ...overlay, showQR: e.target.checked })}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Mobile AR Continuity</span>
                                <span style={{ fontSize: '0.6rem', color: '#71717a' }}>Enable "Scan to Mobile" QR code in the embed.</span>
                            </div>
                        </label>
                    </div>

                    {/* CTA Spatial Control */}
                    <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Zap size={18} className="gold-text" /> Spatial CTA Placement
                        </h4>

                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ fontSize: '0.7rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>
                                Your Call-To-Action button is now part of the 3D scene. Drag it in the calibration window or use the controls below to position it perfectly.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.65rem' }}>Position X</label>
                                    <input
                                        type="number" step="0.05" className="input" style={{ height: '2.5rem', fontSize: '0.8rem' }}
                                        value={ctaSettings.positionX}
                                        onChange={(e) => setCtaSettings({ ...ctaSettings, positionX: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.65rem' }}>Position Y</label>
                                    <input
                                        type="number" step="0.05" className="input" style={{ height: '2.5rem', fontSize: '0.8rem' }}
                                        value={ctaSettings.positionY}
                                        onChange={(e) => setCtaSettings({ ...ctaSettings, positionY: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.65rem' }}>Theme Color</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            value={ctaSettings.color}
                                            onChange={(e) => setCtaSettings({ ...ctaSettings, color: e.target.value })}
                                            style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text" className="input" style={{ height: '2.5rem', fontSize: '0.7rem', padding: '4px 8px' }}
                                            value={ctaSettings.color}
                                            onChange={(e) => setCtaSettings({ ...ctaSettings, color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="label" style={{ fontSize: '0.65rem' }}>Edge Radius (px)</label>
                                    <input
                                        type="number" className="input" style={{ height: '2.5rem', fontSize: '0.8rem' }}
                                        value={ctaSettings.borderRadius}
                                        onChange={(e) => setCtaSettings({ ...ctaSettings, borderRadius: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setCtaSettings({ ...ctaSettings, positionX: 0, positionY: -0.5 })}
                                style={{ width: '100%', color: '#FFD700', background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.1)', padding: '10px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 800 }}
                            >
                                Reset CTA Position
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Maximize Overlay */}
            < AnimatePresence >
                {isMaximized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="maximize-overlay"
                    >
                        <div className="maximize-header">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Precision Calibration</h2>
                                <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>Drag keys directly on the stage for pixel-perfect placement.</p>
                            </div>
                            <button onClick={() => setIsMaximized(false)} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Exit Maximize</button>
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
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ color: '#FFD700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Zap size={18} /> CTA Precision
                                    </h4>
                                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{form.ctaText || 'CTA Button'}</span>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: ctaSettings.color }} />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <span>Spatial X: {ctaSettings.positionX}</span>
                                            <span>Spatial Y: {ctaSettings.positionY}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>
                                        Tip: Use your mouse or finger to drag keys. Exact coordinates are updated instantly in the main workspace.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
                }
            </AnimatePresence >

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
        </div >
    );
}
