import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { BadgeIcon } from './BadgeAssets';
import { BadgeDefinition, BadgeTier, UserBadge } from '../../../shared/types/gamification';
import { getBadgeDefinition } from '../services/badgeService';
import { useLanguage } from '../../../shared/hooks/useLanguage';

interface BadgeUnlockModalProps {
    badge: UserBadge | null;
    onClose: () => void;
}

const tierLabels: Record<BadgeTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    diamond: 'Diamond'
};

const tierColors: Record<BadgeTier, { bg: string; text: string; glow: string }> = {
    bronze: {
        bg: 'from-amber-900/90 via-amber-800/80 to-amber-700/90',
        text: 'text-amber-300',
        glow: 'shadow-amber-500/50'
    },
    silver: {
        bg: 'from-slate-600/90 via-slate-500/80 to-slate-400/90',
        text: 'text-slate-200',
        glow: 'shadow-slate-400/50'
    },
    gold: {
        bg: 'from-yellow-700/90 via-yellow-600/80 to-yellow-500/90',
        text: 'text-yellow-200',
        glow: 'shadow-yellow-400/50'
    },
    diamond: {
        bg: 'from-cyan-700/90 via-cyan-600/80 to-cyan-400/90',
        text: 'text-cyan-200',
        glow: 'shadow-cyan-400/50'
    }
};

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ badge, onClose }) => {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [definition, setDefinition] = useState<BadgeDefinition | null>(null);

    useEffect(() => {
        if (badge) {
            const def = getBadgeDefinition(badge.badgeId);
            setDefinition(def || null);

            // Start animation sequence
            setIsVisible(true);

            // Flip card after 300ms
            const flipTimer = setTimeout(() => {
                setIsCardFlipped(true);
                setShowConfetti(true);
            }, 400);

            // Hide confetti after 2s
            const confettiTimer = setTimeout(() => {
                setShowConfetti(false);
            }, 2500);

            return () => {
                clearTimeout(flipTimer);
                clearTimeout(confettiTimer);
            };
        } else {
            setIsVisible(false);
            setIsCardFlipped(false);
            setShowConfetti(false);
        }
    }, [badge]);

    if (!badge || !definition) return null;

    const tier = badge.unlockedTier || 'bronze';
    const colors = tierColors[tier];

    // Helper to access nested translation keys like 'badges.fasting.qadha.title'
    const getNestedTranslation = (key: string): string => {
        const fullKey = `gamification.${key}`;
        const keys = fullKey.split('.');
        let value: any = t;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // fallback to key if not found
            }
        }
        return typeof value === 'string' ? value : key;
    };

    const title = getNestedTranslation(definition.titleKey);
    const desc = getNestedTranslation(definition.descriptionKey);
    const history = definition.historyKey ? getNestedTranslation(definition.historyKey) : null;

    const handleClose = () => {
        setIsVisible(false);
        setIsCardFlipped(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={handleClose}
        >
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Confetti/Sparkle Effect */}
            {showConfetti && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-20px',
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${1.5 + Math.random()}s`
                            }}
                        >
                            <Sparkles
                                className={`w-4 h-4 ${['text-yellow-400', 'text-amber-300', 'text-cyan-400', 'text-pink-400', 'text-emerald-400'][i % 5]
                                    }`}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Card Container - Perspektif */}
            <div
                className="relative perspective-1000"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Card with 3D Flip */}
                <div
                    className={`relative w-80 h-[480px] transition-transform duration-700 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''
                        }`}
                >
                    {/* Card Back (Shown first) */}
                    <div
                        className={`absolute inset-0 w-full h-full rounded-3xl backface-hidden
                            bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900
                            border-2 border-slate-600
                            flex items-center justify-center
                            shadow-2xl
                        `}
                    >
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center animate-pulse">
                                <Sparkles className="w-12 h-12 text-slate-500" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                                {t.gamification?.badges?.unlocking || 'Unlocking...'}
                            </p>
                        </div>
                    </div>

                    {/* Card Front (Badge Reveal) */}
                    <div
                        className={`absolute inset-0 w-full h-full rounded-3xl backface-hidden rotate-y-180
                            bg-gradient-to-br ${colors.bg}
                            border-2 border-white/20
                            shadow-2xl ${colors.glow}
                            overflow-hidden
                        `}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-3 right-3 z-10 p-1.5 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-white/70" />
                        </button>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent" />

                        {/* Content */}
                        <div className="relative h-full flex flex-col items-center justify-center p-5 text-center overflow-y-auto">
                            {/* Tier Label */}
                            <div className={`mb-3 px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20`}>
                                <span className={`text-xs font-black uppercase tracking-widest ${colors.text}`}>
                                    {tierLabels[tier]} {t.gamification?.badges?.tier || 'Tier'}
                                </span>
                            </div>

                            {/* Badge Icon with Animation */}
                            <div className={`w-24 h-24 mb-4 ${isCardFlipped ? 'animate-badge-reveal' : ''}`}>
                                <BadgeIcon id={badge.badgeId} tier={tier} />
                            </div>

                            {/* Title */}
                            <h2 className="text-lg font-black text-white mb-1 drop-shadow-lg">
                                {String(title)}
                            </h2>

                            {/* Description */}
                            <p className="text-sm text-white/80 leading-relaxed mb-3">
                                {String(desc)}
                            </p>

                            {/* History/Quote */}
                            {history && history !== definition.historyKey && (
                                <div className="bg-black/20 rounded-xl p-3 mb-3 border border-white/10">
                                    <p className="text-xs text-white/70 italic leading-relaxed">
                                        "{String(history)}"
                                    </p>
                                </div>
                            )}

                            {/* Congratulations */}
                            <div className="mt-auto pt-2 flex items-center gap-2 text-white/90">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    {t.gamification?.badges?.congratulations || 'Congratulations!'}
                                </span>
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgeUnlockModal;
