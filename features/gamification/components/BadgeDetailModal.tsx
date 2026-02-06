import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BadgeDefinition, UserBadge } from '../../../shared/types/gamification';
import { BadgeIcon } from './BadgeAssets';
import { X, Lock } from 'lucide-react';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { getBadgeDefinition } from '../services/badgeService';

interface BadgeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    definition: BadgeDefinition;
    userBadge?: UserBadge | null;
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
    isOpen,
    onClose,
    definition,
    userBadge,
    ramadhanConfig,
    qadhaConfig
}) => {
    const { t } = useLanguage();
    const [isFlipped, setIsFlipped] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Preview state, defaults to current unlocked tier
    const [previewTier, setPreviewTier] = useState<string | undefined>(userBadge?.unlockedTier);

    // Re-resolve definition using configs if it's a dynamic badge to get correct thresholds
    const dynamicDef = useMemo(() =>
        getBadgeDefinition(definition.id, ramadhanConfig, qadhaConfig) || definition
        , [definition, ramadhanConfig, qadhaConfig]);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setIsClosing(false);
            setIsFlipped(false);
            setShowContent(false);
            setPreviewTier(userBadge?.unlockedTier);

            // Auto flip sequence
            const flipTimer = setTimeout(() => {
                setIsFlipped(true);
            }, 300);

            const contentTimer = setTimeout(() => {
                setShowContent(true);
            }, 800);

            return () => {
                clearTimeout(flipTimer);
                clearTimeout(contentTimer);
            };
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setShowContent(false);
        setIsFlipped(false);

        // Wait for animation to finish then unmount
        setTimeout(() => {
            onClose();
        }, 500);
    };

    if (!isOpen) return null;

    // Safe translation helper
    const getTranslation = (path: string) => {
        try {
            const keys = path.split('.');
            let current = t.gamification;
            for (const key of keys) {
                if (!current) return path;
                current = current[key];
            }
            if (typeof current !== 'string') return path;

            // Handle year replacement for dynamic badges
            const match = definition.id.match(/_(\d{4})$/);
            if (match) {
                const year = match[1];
                if (current.includes('{year}')) {
                    return current.replace(/{year}/g, year);
                }
                if (path.includes('.title') && !current.includes(year)) {
                    return `${current} ${year}`;
                }
            }
            return current;
        } catch {
            return path;
        }
    };

    const title = getTranslation(definition.titleKey);
    const desc = getTranslation(definition.descriptionKey);
    const history = definition.historyKey ? getTranslation(definition.historyKey) : null;

    const tier = userBadge?.unlockedTier;
    const isUnlocked = !!tier;
    const currentCount = userBadge?.currentCount || 0;

    const getGradientStyle = () => {
        const id = definition.id;
        if (id.startsWith('prayer')) {
            if (id.includes('subuh')) return 'from-slate-900 via-purple-900 to-slate-900';
            if (id.includes('sunnah')) return 'from-blue-500 via-sky-400 to-amber-300';
            if (id.includes('mosque')) return 'from-emerald-800 via-teal-600 to-emerald-900';
            return 'from-blue-600 via-indigo-500 to-blue-800';
        }
        if (id.startsWith('fasting')) {
            if (id.includes('hero')) return 'from-indigo-950 via-purple-800 to-indigo-900';
            if (id.includes('qadha')) return 'from-pink-800 via-rose-600 to-pink-900';
            return 'from-indigo-800 via-violet-600 to-indigo-900';
        }
        if (id.startsWith('dzikir')) {
            if (id.includes('morning')) return 'from-amber-600 via-yellow-400 to-orange-500';
            return 'from-indigo-700 via-blue-600 to-indigo-800';
        }
        return 'from-rose-700 via-red-500 to-rose-800';
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'animate-in fade-in'}`}
                onClick={handleClose}
            />

            {/* 3D Card Container */}
            <div className={`relative w-full max-w-sm perspective-1000 z-10 transition-all duration-500 ${isClosing ? 'scale-90 opacity-0' : ''}`}>
                <div className={`relative transition-all duration-700 transform-style-3d ${isFlipped && !isClosing ? 'rotate-y-0 scale-100' : 'rotate-y-90 scale-50 opacity-0'}`}>

                    {/* Card Body */}
                    <div className={`
                        relative overflow-hidden rounded-2xl shadow-2xl 
                        bg-gradient-to-br ${getGradientStyle()}
                        text-white
                        border border-white/20
                    `}>
                        {/* Decorative Background Patterns */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative p-8 flex flex-col items-center min-h-[500px]">
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors backdrop-blur-md"
                            >
                                <X className="w-5 h-5 text-white/80" />
                            </button>

                            {/* Main Badge Icon - Floating Animation */}
                            <div className={`
                                w-40 h-40 mb-2 drop-shadow-2xl transition-all duration-1000 delay-300
                                ${showContent ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 scale-90'}
                            `}>
                                <div className="animate-float">
                                    <BadgeIcon id={definition.id} tier={previewTier} />
                                    {!isUnlocked && !previewTier && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm">
                                            <Lock className="w-12 h-12 text-white/70" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview Toggles CTA */}
                            <div className={`
                                flex gap-2 mb-4 transition-all duration-700 delay-400
                                ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                            `}>
                                {dynamicDef.tiers.map((t) => (
                                    <button
                                        key={t.tier}
                                        onClick={() => setPreviewTier(t.tier)}
                                        className={`
                                            px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border
                                            ${previewTier === t.tier
                                                ? 'bg-white text-slate-900 border-white shadow-lg scale-105'
                                                : 'bg-black/20 text-white/70 border-white/10 hover:bg-black/40'}
                                        `}
                                    >
                                        {t.tier}
                                    </button>
                                ))}
                            </div>

                            {/* Content Section */}
                            <div className={`
                                text-center w-full transition-all duration-700 delay-500
                                ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
                            `}>
                                <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                                    <span className="text-[10px] font-black tracking-widest uppercase text-white/80">
                                        {t.gamification.rank[tier || 'novice'] || tier || 'LOCKED'}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-black mb-1 drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/80">
                                    {title}
                                </h2>
                                <p className="text-sm font-medium text-white/80 mb-6">{desc}</p>

                                {/* Historical Context / Quote */}
                                {history && (
                                    <div className="mb-6 relative">
                                        <div className="absolute -top-3 -left-2 text-4xl text-white/20 font-serif">"</div>
                                        <div className="relative bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                                            <p className="text-xs italic leading-relaxed text-white/90">
                                                {history}
                                            </p>
                                        </div>
                                        <div className="absolute -bottom-6 -right-2 text-4xl text-white/20 font-serif rotate-180">"</div>
                                    </div>
                                )}

                                {/* Progress Tiers */}
                                <div className="w-full space-y-2 mt-auto">
                                    <div className="text-[10px] font-bold text-left uppercase text-white/50 tracking-widest pl-1 mb-1">
                                        Milestones
                                    </div>
                                    <div className="bg-black/20 rounded-2xl p-2 space-y-1 backdrop-blur-sm">
                                        {dynamicDef.tiers.map((t) => {
                                            const isAchieved = (currentCount >= t.requirement);
                                            return (
                                                <div
                                                    key={t.tier}
                                                    className={`
                                                        flex justify-between items-center text-xs p-2 rounded-2xl transition-all
                                                        ${isAchieved ? 'bg-white/20 shadow-sm' : 'opacity-40'}
                                                    `}
                                                >
                                                    <span className="font-bold capitalize flex items-center gap-2">
                                                        {isAchieved && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />}
                                                        {t.tier}
                                                    </span>
                                                    <span className="font-mono">{t.requirement}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .rotate-y-90 { transform: rotateY(90deg); }
                .rotate-y-0 { transform: rotateY(0deg); }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}</style>
        </div>,
        document.body
    );
};
