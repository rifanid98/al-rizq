import React from 'react';
import { BadgeIcon } from './BadgeAssets';
import { Lock } from 'lucide-react';
import { BadgeDefinition, UserBadge } from '../../../shared/types/gamification';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { BadgeDetailModal } from './BadgeDetailModal';
import { getBadgeDefinition } from '../services/badgeService';

interface BadgeItemProps {
    definition: BadgeDefinition;
    userBadge?: UserBadge | null;
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}

export const BadgeItem: React.FC<BadgeItemProps> = ({ definition, userBadge, ramadhanConfig, qadhaConfig }) => {
    const { t } = useLanguage();

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
                // Only auto-append year to title if it doesn't have it
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

    const isUnlocked = !!userBadge?.unlockedTier;
    const tier = userBadge?.unlockedTier;

    const getBadgeGradient = () => {
        if (!isUnlocked) return 'from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-900/50';

        const id = definition.id;

        if (id.startsWith('prayer')) {
            if (id.includes('subuh')) return 'from-blue-900/20 to-pink-900/20 dark:from-blue-900/40 dark:to-pink-900/40';
            if (id.includes('sunnah')) return 'from-sky-100/50 to-amber-100/50 dark:from-sky-900/20 dark:to-amber-900/20';
            if (id.includes('mosque')) return 'from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/20 dark:to-teal-900/20';
            return 'from-sky-100/50 to-blue-100/50 dark:from-sky-900/20 dark:to-blue-900/20';
        }
        if (id.startsWith('fasting')) {
            if (id.includes('hero')) return 'from-indigo-900/20 to-purple-900/20 dark:from-indigo-900/40 dark:to-purple-900/40';
            if (id.includes('qadha')) return 'from-pink-100/50 to-rose-100/50 dark:from-pink-900/20 dark:to-rose-900/20';
            return 'from-indigo-100/50 to-violet-100/50 dark:from-indigo-900/20 dark:to-violet-900/20';
        }
        if (id.startsWith('dzikir')) {
            if (id.includes('morning')) return 'from-amber-100/50 to-yellow-100/50 dark:from-amber-900/20 dark:to-yellow-900/20';
            return 'from-indigo-100/50 to-blue-100/50 dark:from-indigo-900/20 dark:to-blue-900/20';
        }
        // General / Istiqomah
        return 'from-rose-100/50 to-red-100/50 dark:from-rose-900/20 dark:to-red-900/20';
    };

    const getTierBorder = () => {
        if (!isUnlocked) return 'border-slate-200 dark:border-slate-800';
        switch (tier) {
            case 'bronze': return 'border-orange-200 dark:border-orange-900/50';
            case 'silver': return 'border-slate-300 dark:border-slate-700';
            case 'gold': return 'border-yellow-200 dark:border-yellow-900/50 shadow-yellow-500/10';
            case 'diamond': return 'border-cyan-200 dark:border-cyan-900/50 shadow-cyan-500/10';
            default: return '';
        }
    };

    // Re-resolve definition using configs if it's a dynamic badge to get correct thresholds
    const dynamicDef = getBadgeDefinition(definition.id, ramadhanConfig, qadhaConfig) || definition;

    // Calculate progress using the dynamic definition
    const currentCount = userBadge?.currentCount || 0;
    const tiers = dynamicDef.tiers || [];
    const nextTierReq = tiers.find(t => t.requirement > currentCount)?.requirement;
    const maxReq = tiers.length > 0 ? tiers[tiers.length - 1].requirement : 100;
    const displayReq = nextTierReq || maxReq;
    const progressPercent = Math.min(100, (currentCount / displayReq) * 100);

    const [showModal, setShowModal] = React.useState(false);

    return (
        <>
            <div
                onClick={() => setShowModal(true)}
                className={`cursor-pointer relative group p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center gap-4 overflow-hidden bg-gradient-to-br ${getBadgeGradient()} ${getTierBorder()} ${!isUnlocked ? 'grayscale opacity-70' : ''}`}
            >
                {/* Badge Icon (SVG) */}
                <div className={`relative w-24 h-24 transition-transform duration-500 ${isUnlocked ? 'group-hover:scale-110 drop-shadow-xl' : 'opacity-50'}`}>
                    <BadgeIcon id={definition.id} tier={tier} />

                    {/* Lock Overlay */}
                    {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 rounded-full backdrop-blur-[1px]">
                            <Lock className="w-8 h-8 text-slate-500" />
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="font-black text-xs uppercase tracking-wider mb-1 line-clamp-1 text-slate-800 dark:text-slate-200">{title}</h4>
                    <p className="text-[10px] font-medium opacity-80 line-clamp-2 leading-tight min-h-[2.5em] text-slate-600 dark:text-slate-400">{desc}</p>
                </div>

                <div className="w-full mt-auto">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-80 mb-1 text-slate-500 dark:text-slate-400">
                        <span>{tier || 'Locked'}</span>
                        <span>{currentCount} / {displayReq}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            <BadgeDetailModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                definition={dynamicDef}
                userBadge={userBadge}
                ramadhanConfig={ramadhanConfig}
                qadhaConfig={qadhaConfig}
            />
        </>
    );
};
