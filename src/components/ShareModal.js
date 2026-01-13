import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Facebook, MessageCircle, CheckCircle, Smartphone, Layout } from 'lucide-react';
import { useState } from 'react';

export default function ShareModal({ isOpen, onClose, ad, onShare }) {
    const [copied, setCopied] = useState(false);
    const [shareType, setShareType] = useState('feed'); // 'feed' or 'ar'

    if (!ad) return null;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = shareType === 'feed'
        ? `${baseUrl}/ad/${ad._id}/views`
        : `${baseUrl}/ad/${ad.slug || ad._id}`;

    const title = ad.title || 'Check out this AR Experience';

    const trackShare = () => {
        if (onShare) onShare();
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        trackShare();
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFacebookShare = () => {
        trackShare();
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        onClose();
    };

    const handleMessengerShare = () => {
        trackShare();
        const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(shareUrl)}`;
        window.open(messengerUrl, '_blank', 'width=600,height=400');
        onClose();
    };

    const handleWhatsAppShare = () => {
        trackShare();
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 9998,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Modal - Centered via flexbox on parent */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.98) 100%)',
                            borderRadius: '24px',
                            padding: '2rem',
                            width: '90%',
                            maxWidth: '420px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            zIndex: 9999,
                            position: 'relative'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                transition: 'all 0.2s'
                            }}
                        >
                            <X size={20} />
                        </button>

                        {/* Title */}
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            marginBottom: '1.5rem',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            Share Experience
                        </h3>

                        {/* Type Toggle */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.25rem',
                            borderRadius: '12px',
                            marginBottom: '2rem'
                        }}>
                            <button
                                onClick={() => setShareType('feed')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: shareType === 'feed' ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    color: shareType === 'feed' ? 'white' : 'rgba(255,255,255,0.5)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Layout size={18} />
                                Feed Link
                            </button>
                            <button
                                onClick={() => setShareType('ar')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: shareType === 'ar' ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    color: shareType === 'ar' ? 'white' : 'rgba(255,255,255,0.5)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Smartphone size={18} />
                                AR Direct
                            </button>
                        </div>

                        <p style={{
                            color: '#a1a1aa',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            {shareType === 'feed'
                                ? 'Share the video preview page with campaign details.'
                                : 'Share the direct AR camera experience link.'}
                        </p>

                        {/* Share Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Facebook */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleFacebookShare}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    background: 'rgba(24, 119, 242, 0.1)',
                                    border: '1px solid rgba(24, 119, 242, 0.3)',
                                    borderRadius: '12px',
                                    color: '#1877F2',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Facebook size={24} fill="#1877F2" />
                                Share on Facebook
                            </motion.button>

                            {/* Messenger */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleMessengerShare}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    background: 'rgba(0, 132, 255, 0.1)',
                                    border: '1px solid rgba(0, 132, 255, 0.3)',
                                    borderRadius: '12px',
                                    color: '#0084FF',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <MessageCircle size={24} />
                                Share via Messenger
                            </motion.button>

                            {/* WhatsApp */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleWhatsAppShare}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    background: 'rgba(37, 211, 102, 0.1)',
                                    border: '1px solid rgba(37, 211, 102, 0.3)',
                                    borderRadius: '12px',
                                    color: '#25D366',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Share on WhatsApp
                            </motion.button>

                            {/* Copy Link */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCopyLink}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                    border: copied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: copied ? '#22c55e' : 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
                                {copied ? 'Link Copied!' : 'Copy Link'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
