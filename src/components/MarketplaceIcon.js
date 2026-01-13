import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

const Sparkle = ({ size, color, delay }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 90, 180]
        }}
        transition={{
            duration: 1.5,
            repeat: Infinity,
            delay,
            ease: "easeInOut"
        }}
        style={{
            position: 'absolute',
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: '50%',
            filter: 'blur(1px)',
            boxShadow: `0 0 4px ${color}`
        }}
    />
);

export default function MarketplaceIcon({ size = 20 }) {
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
            {/* Sparkles around the icon */}
            <div style={{ position: 'absolute', top: '-4px', left: '-4px' }}><Sparkle size={3} color="#FFD700" delay={0} /></div>
            <div style={{ position: 'absolute', top: '-2px', right: '-2px' }}><Sparkle size={2} color="#FFFFA0" delay={0.5} /></div>
            <div style={{ position: 'absolute', bottom: '-4px', right: '0px' }}><Sparkle size={3} color="#D4AF37" delay={1} /></div>
            <div style={{ position: 'absolute', bottom: '2px', left: '-2px' }}><Sparkle size={2} color="#FFD700" delay={1.5} /></div>

            <motion.div
                animate={{
                    filter: [
                        'drop-shadow(0 0 1px rgba(212, 175, 55, 0.5))',
                        'drop-shadow(0 0 4px rgba(212, 175, 55, 0.8))',
                        'drop-shadow(0 0 1px rgba(212, 175, 55, 0.5))'
                    ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <Crown
                    size={size}
                    style={{
                        color: '#FFD700',
                        fill: 'url(#goldGradient)',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                    }}
                />
            </motion.div>

            {/* SVG Gradient Definition */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#D4AF37' }} />
                        <stop offset="50%" style={{ stopColor: '#FFD700' }} />
                        <stop offset="100%" style={{ stopColor: '#D4AF37' }} />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
