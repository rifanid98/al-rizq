
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { LEVEL_TIERS, getTierColorClass } from '../constants/levels';
import { LevelTier } from '../../../shared/types/gamification';

interface LevelTiersModalProps {
    currentLevel: number;
    onClose: () => void;
}

export const LevelTiersModal: React.FC<LevelTiersModalProps> = ({ currentLevel, onClose }) => {
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Helper for safe portal rendering
    if (!mounted) return null;

    // Determine current tier index
    const currentTierIndex = LEVEL_TIERS.findIndex(tier =>
        currentLevel >= tier.level &&
        (LEVEL_TIERS[LEVEL_TIERS.indexOf(tier) + 1] ? currentLevel < LEVEL_TIERS[LEVEL_TIERS.indexOf(tier) + 1].level : true)
    );

    // Dynamic Gradient Map (Matched with GamificationStats)
    const getGradient = (theme: string) => {
        switch (theme) {
            case 'emerald': return 'from-emerald-400 to-teal-600 shadow-emerald-500/20';
            case 'cyan': return 'from-cyan-400 to-blue-600 shadow-cyan-500/20';
            case 'amber': return 'from-amber-400 to-orange-600 shadow-amber-500/20';
            case 'violet': return 'from-violet-400 to-fuchsia-600 shadow-violet-500/20';
            default: return 'from-slate-400 to-zinc-600 shadow-slate-500/20';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Floating Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4 pt-16">
                    {LEVEL_TIERS.map((tier, index) => {
                        const isUnlocked = currentLevel >= tier.level;
                        const isCurrent = index === currentTierIndex;
                        const isNext = index === currentTierIndex + 1;

                        const themeColor = tier.colorTheme;
                        const gradientClass = getGradient(themeColor);

                        // Card Styles
                        const containerClass = isUnlocked || isCurrent
                            ? `bg-gradient-to-br ${gradientClass} text-white border-transparent`
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500';

                        // Resolve name
                        const rankKey = tier.nameKey.split('.')[1] || 'novice';
                        const levels = t?.gamification?.levels || {};
                        const rankName = (levels as any)[rankKey] || rankKey;

                        return (
                            <div
                                key={tier.level}
                                className={`
                                    relative p-4 rounded-2xl border transition-all duration-300 shadow-md
                                    ${containerClass}
                                    ${isCurrent ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900 ' + getTierColorClass(themeColor, 'ring') + ' scale-[1.02]' : ''}
                                    ${isNext ? 'border-dashed border-2 opacity-80' : 'border-solid'}
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm backdrop-blur-md
                                            ${isUnlocked || isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}
                                        `}>
                                            {isUnlocked ? (
                                                <ShieldCheck className="w-6 h-6" />
                                            ) : (
                                                <Lock className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-bold text-lg leading-none ${isUnlocked || isCurrent ? 'text-white' : ''}`}>
                                                    {rankName}
                                                </h3>
                                                {isCurrent && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-white shadow-sm backdrop-blur-md">
                                                        {t.gamification.current}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs font-medium mt-1 ${isUnlocked || isCurrent ? 'text-white/80' : ''}`}>
                                                Level {tier.level}+
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`text-xs font-bold ${isUnlocked || isCurrent ? 'text-white/90' : ''}`}>
                                            {tier.minXp.toLocaleString()} XP
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
};
