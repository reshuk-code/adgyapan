
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, QrCode, CreditCard, Upload, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Checkout() {
    const router = useRouter();
    const { plan } = router.query;
    const [method, setMethod] = useState('qr');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    if (!plan && typeof window !== 'undefined') {
        router.push('/pricing');
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const uploadToCloudinary = async (file) => {
        const signRes = await fetch('/api/sign-cloudinary');
        const signData = await signRes.json();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.api_key);
        formData.append('timestamp', signData.timestamp);
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, {
            method: 'POST', body: formData
        });
        const uploadData = await uploadRes.json();
        return uploadData.secure_url;
    };

    const handleSubmit = async () => {
        if (!file) return alert('Please upload your payment statement/screenshot');
        setLoading(true);
        try {
            const proofUrl = await uploadToCloudinary(file);
            const res = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan,
                    paymentProof: proofUrl,
                    amount: plan === 'pro' ? 1999 : 0
                })
            });
            if (res.ok) setStep(2);
            else {
                const data = await res.json();
                alert(data.error || 'Submission failed');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: '4rem', textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ color: '#10b981', marginBottom: '2rem' }}>
                        <CheckCircle2 size={80} style={{ margin: '0 auto' }} />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Sent for Review!</h2>
                    <p style={{ color: '#a1a1aa', marginBottom: '3rem', fontSize: '1.1rem' }}>
                        Your payment proof has been submitted. Our admin will verify it within 2-4 hours and activate your <span style={{ color: 'white', fontWeight: 700 }}>{plan?.toUpperCase()}</span> plan.
                    </p>
                    <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem' }}>Go to Dashboard</Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: '3rem', paddingBottom: '7rem', maxWidth: '1000px', padding: '3rem 1.5rem 7rem' }}>
            <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Back to Pricing
            </Link>

            <div className="checkout-grid">
                {/* Left: Payment Options */}
                <div>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Checkout</h1>
                    <p style={{ color: '#71717a', marginBottom: '3rem' }}>Secure your <span style={{ color: 'white', fontWeight: 600 }}>{plan?.toUpperCase()}</span> membership.</p>

                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Select Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div
                            onClick={() => setMethod('qr')}
                            style={{
                                padding: '1.5rem',
                                border: method === 'qr' ? '2px solid #fe2c55' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '1rem',
                                background: method === 'qr' ? 'rgba(254, 44, 85, 0.05)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: method === 'qr' ? '#fe2c55' : 'white',
                                flexShrink: 0
                            }}>
                                <QrCode size={24} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800 }}>Mobile Banking / Fonepay</div>
                                <div style={{ fontSize: '0.85rem', color: '#71717a' }}>Instant via QR Scan (Recommended for Nepal)</div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '1.5rem',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '1rem',
                                background: 'rgba(255,255,255,0.02)',
                                cursor: 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                opacity: 0.6
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <CreditCard size={24} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800 }}>PayPal <span style={{ marginLeft: '10px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>COMING SOON</span></div>
                                <div style={{ fontSize: '0.85rem', color: '#71717a' }}>International Payments</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', borderLeft: '3px solid #3b82f6', paddingLeft: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#3b82f6', marginBottom: '0.5rem', fontWeight: 800 }}>
                            <ShieldCheck size={20} /> Professional Verification
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                            Since direct integration with Fonepay is limited for developers, we use a manual verification system to protect your data and payment.
                        </p>
                    </div>
                </div>

                {/* Right: Payment Action */}
                <div className="glass-card" style={{ padding: '2.5rem', alignSelf: 'start' }}>
                    {method === 'qr' ? (
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Scan to Pay</h3>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '1.5rem', marginBottom: '1.5rem', maxWidth: '280px', margin: '0 auto 1.5rem auto' }}>
                                <img src="/images/payment-qr.png" alt="Payment QR" style={{ width: '100%', display: 'block' }} />
                            </div>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', textAlign: 'left' }}>
                                <AlertCircle size={24} style={{ flexShrink: 0, color: '#f59e0b', marginTop: '3px' }} />
                                <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>
                                    Please send <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>NPR 1999</span> and upload the screenshot/statement below.
                                </span>
                            </div>

                            <div className="form-group" style={{ textAlign: 'left' }}>
                                <label className="label">Upload Payment Proof</label>
                                <label className="input" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '1rem' }}>
                                    <Upload size={20} style={{ color: '#fe2c55' }} />
                                    <span style={{ fontSize: '0.85rem', color: file ? 'white' : '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? file.name : 'Statement or Screenshot'}</span>
                                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>

                            {preview && (
                                <div style={{ marginTop: '1rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', height: '120px' }}>
                                    <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !file}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '2rem', height: '3.5rem', fontWeight: 1000 }}
                            >
                                {loading ? 'Processing...' : 'Submit Payment'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <CreditCard size={48} style={{ color: '#71717a', marginBottom: '1rem' }} />
                            <h3>PayPal Coming Soon</h3>
                            <p style={{ color: '#71717a' }}>Please use the QR method for now.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .glass-card { 
                    background: rgba(255,255,255,0.03); 
                    backdrop-filter: blur(20px); 
                    border-radius: 2rem;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                
                .checkout-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
                    gap: 4rem;
                }

                @media (max-width: 968px) {
                    .checkout-grid {
                        grid-template-columns: 1fr;
                        gap: 3rem;
                    }
                }

                @media (max-width: 640px) {
                    .checkout-grid {
                        gap: 2rem;
                    }
                }
            `}</style>
        </div>
    );
}
