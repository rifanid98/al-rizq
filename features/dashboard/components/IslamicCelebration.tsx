
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../../shared/hooks/useLanguage';

interface IslamicCelebrationProps {
    show: boolean;
    onComplete: () => void;
}

const StarIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" className={className} style={style}>
        {/* Rub el Hizb / 8-pointed star */}
        <path
            fill="currentColor"
            d="M 50 0 L 64.6 35.4 L 100 50 L 64.6 64.6 L 50 100 L 35.4 64.6 L 0 50 L 35.4 35.4 Z"
        />
    </svg>
);

const CrescentIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg viewBox="0 0 100 100" className={className} style={style}>
        <path
            fill="currentColor"
            d="M 50 10 A 40 40 0 1 0 50 90 A 35 35 0 1 1 50 10 Z"
        />
    </svg>
);

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    type: 'star' | 'crescent' | 'dot';
    velocity: { x: number; y: number };
    opacity: number;
}

const COLORS = [
    '#fbbf24', // amber-400
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#059669', // emerald-600
    '#34d399', // emerald-400
    '#ffffff', // white
];



const IslamicCelebration: React.FC<IslamicCelebrationProps> = ({ show, onComplete }) => {
    const { t } = useLanguage();
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [currentQuote, setCurrentQuote] = useState(t.celebration.quotes[0]);

    useEffect(() => {
        if (show && !isActive) {
            setIsActive(true);
            setCurrentQuote(t.celebration.quotes[Math.floor(Math.random() * t.celebration.quotes.length)]);
            generateParticles();

            const timer = setTimeout(() => {
                setIsActive(false);
                setParticles([]);
                onComplete();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [show]);

    const generateParticles = () => {
        const newParticles: Particle[] = [];
        const count = 60;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 5 + Math.random() * 15;
            newParticles.push({
                id: i,
                x: centerX,
                y: centerY,
                size: 15 + Math.random() * 25,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
                type: Math.random() > 0.6 ? 'star' : (Math.random() > 0.5 ? 'crescent' : 'dot'),
                velocity: {
                    x: Math.cos(angle) * velocity,
                    y: Math.sin(angle) * velocity
                },
                opacity: 1
            });
        }
        setParticles(newParticles);
    };

    useEffect(() => {
        if (!isActive) return;

        let animationFrame: number;
        const update = () => {
            setParticles(prev => prev.map(p => ({
                ...p,
                x: p.x + p.velocity.x,
                y: p.y + p.velocity.y,
                velocity: {
                    x: p.velocity.x * 0.98,
                    y: (p.velocity.y * 0.98) + 0.3 // gravity
                },
                rotation: p.rotation + 3,
                opacity: Math.max(0, p.opacity - 0.006)
            })));
            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.x}px`,
                        top: `${p.y}px`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        color: p.color,
                        opacity: p.opacity,
                        transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
                    }}
                >
                    {p.type === 'star' && <StarIcon className="w-full h-full drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />}
                    {p.type === 'crescent' && <CrescentIcon className="w-full h-full drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
                    {p.type === 'dot' && <div className="w-full h-full rounded-full bg-current shadow-[0_0_8px_rgba(255,255,255,0.6)]" />}
                </div>
            ))}

            <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="bg-white/10 dark:bg-emerald-900/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(5,150,105,0.2)] animate-in zoom-in-75 duration-500 max-w-md w-full">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-2xl">
                            <StarIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                {currentQuote.title}
                            </h2>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
                                {t.celebration.keepGoing}
                            </p>
                            <div className="pt-4 space-y-2">
                                <p className="text-lg font-bold text-slate-800 dark:text-white leading-relaxed italic">
                                    "{currentQuote.quote}"
                                </p>
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60">
                                    — {currentQuote.source}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IslamicCelebration;
