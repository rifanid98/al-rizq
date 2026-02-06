import React, { useState, useMemo } from 'react';
import { BADGES } from '../constants/badges';
import { UserBadge, BadgeCategory } from '../../../shared/types/gamification';
import { BadgeItem } from './BadgeItem';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { getBadgeDefinition } from '../services/badgeService';
import { Sparkles, Moon, Sun, Flame, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';

interface BadgeCollectionProps {
    userBadges: UserBadge[];
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ userBadges, ramadhanConfig, qadhaConfig }) => {
    const { t } = useLanguage();
    const [previewMode, setPreviewMode] = useState(false);
    const currentYearStr = new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = useState(currentYearStr);

    // Filter available years (Current Year + any years found in user badges)
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        years.add(currentYearStr);
        (userBadges || []).forEach(ub => {
            if (!ub || !ub.badgeId) return;
            const match = ub.badgeId.match(/_(\d{4})$/);
            if (match) years.add(match[1]);
        });
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [userBadges, currentYearStr]);

    const categories: { id: BadgeCategory; label: string; icon: any }[] = [
        { id: 'prayer', label: t.tabs.tracker, icon: Sparkles }, // "Sholat"
        { id: 'fasting', label: t.tabs.fasting, icon: Moon },
        { id: 'dzikir', label: t.tabs.dzikir, icon: Sun },
        { id: 'general', label: 'Eksklusif', icon: Flame }, // Or translate general
    ];

    // Toggle Preview Mode
    const togglePreview = () => setPreviewMode(!previewMode);

    return (
        <div className="space-y-6 pb-24">
            {/* Header with Year Tabs and Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-md">
                {/* Year Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1">
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 whitespace-nowrap ${selectedYear === year
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {year === currentYearStr ? `TARGET ${year}` : year}
                        </button>
                    ))}
                </div>

                {/* Preview Toggle (Dev Only) */}
                {import.meta.env.DEV && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePreview}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100"
                    >
                        {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {previewMode ? 'Live View' : 'Preview Mode'}
                    </Button>
                )}
            </div>

            {categories.map(cat => {
                // 1. Get targets/badges ONLY for the selected year
                const catTemplates = BADGES.filter(b => b.category === cat.id && b.isTemplate);

                // For selected year, we show the templates (either as target or with progress)
                const yearlyBadgeIds = catTemplates.map(t => `${t.id}_${selectedYear}`);

                // 2. Filter combinations based on year
                const finalBadgeIds = yearlyBadgeIds.filter(id => {
                    const ub = userBadges.find(b => b.badgeId === id);
                    const isCurrentYear = selectedYear === currentYearStr;
                    // If current year, show everything (targets). If past year, only show unlocked.
                    return isCurrentYear || (ub && ub.unlockedTier);
                });

                const allCatBadges = finalBadgeIds
                    .map(id => {
                        try {
                            return getBadgeDefinition(id, ramadhanConfig, qadhaConfig);
                        } catch (e) {
                            console.error(`Error getting badge definition for ${id}:`, e);
                            return undefined;
                        }
                    })
                    .filter((def): def is any => !!def && !!def.id);

                if (allCatBadges.length === 0) return null;

                return (
                    <div key={cat.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 px-2">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
                                <cat.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                {cat.label}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {allCatBadges.map(def => {
                                const realBadge = userBadges.find(u => u.badgeId === def.id);
                                const mockBadge: UserBadge = {
                                    badgeId: def.id,
                                    unlockedTier: 'gold',
                                    currentCount: 9999,
                                    isNew: false,
                                    unlockedAt: Date.now()
                                };
                                const finalBadge = previewMode ? mockBadge : realBadge;

                                return (
                                    <BadgeItem
                                        key={def.id}
                                        definition={def}
                                        userBadge={finalBadge}
                                        ramadhanConfig={ramadhanConfig}
                                        qadhaConfig={qadhaConfig}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
