
import React, { useState } from 'react';
import { useSunnahPrayer } from '../hooks/useSunnahPrayer';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { Check, Sun, Moon, Star, ChevronDown, Plus, Minus } from 'lucide-react';
import { getLocalDateStr } from '../../../shared/utils/helpers';
import { useStarAnimation } from '../../gamification/context/GamificationContext';
import { GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';

interface SunnahPrayerTrackerProps {
    gamificationConfig: GamificationConfig;
}

export const SunnahPrayerTracker: React.FC<SunnahPrayerTrackerProps> = ({
    gamificationConfig = DEFAULT_GAMIFICATION_CONFIG
}) => {
    const { getPrayers, getLog, togglePrayer, updateRakaat } = useSunnahPrayer();
    const { t } = useLanguage();
    const { triggerAnimation } = useStarAnimation();

    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const date = getLocalDateStr();
    const prayers = getPrayers();

    const completedCount = prayers.filter(p => getLog(date, p.id)?.isCompleted).length;
    const progress = Math.round((completedCount / prayers.length) * 100);
    const isAllCompleted = completedCount === prayers.length && prayers.length > 0;

    const toggleExpansion = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleToggle = (prayerId: string, minRakaat: number) => {
        const log = getLog(date, prayerId);
        const isCurrentlyCompleted = log?.isCompleted;

        // Trigger animation for each individual item when checked
        if (!isCurrentlyCompleted) {
            const points = gamificationConfig.points.sunnahPrayer[prayerId as keyof typeof gamificationConfig.points.sunnahPrayer] || 10;
            triggerAnimation(null, points);

            // Bonus +10 when all sunnah prayers are completed
            if (completedCount === prayers.length - 1) {
                setTimeout(() => triggerAnimation(null, 10), 300);
            }
        }

        togglePrayer(prayerId, log?.rakaat || minRakaat, date);
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'dhuha': return <Sun className="w-4 h-4" />;
            case 'tahajjud': return <Moon className="w-4 h-4" />;
            case 'witir': return <Star className="w-4 h-4" />;
            default: return <Star className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                        {t.sunnah?.prayers?.title || 'Shalat Sunnah'}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {t.sunnah?.prayers?.subtitle || 'Ibadah sunnah harian'}
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden xs:block">
                        <p className="text-[10px] uppercase font-black text-slate-400">Progress</p>
                        <p className={`text-sm font-black ${isAllCompleted ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {completedCount}/{prayers.length}
                        </p>
                    </div>
                    <div className="w-10 h-10 relative flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-slate-100 dark:text-slate-800"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="text-amber-500 transition-all duration-500"
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>
                        {isAllCompleted && <Check className="absolute w-4 h-4 text-amber-500" />}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-3">
                {prayers.map((prayer) => {
                    const log = getLog(date, prayer.id);
                    const isChecked = log?.isCompleted || false;
                    const currentRakaat = log?.rakaat || prayer.minRakaat;
                    const isExpanded = expandedItems.includes(prayer.id);

                    return (
                        <div
                            key={prayer.id}
                            id={`sunnah-prayer-${prayer.id}`}
                            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${isChecked
                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="p-4 flex items-start gap-4">
                                {/* Checkbox */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(prayer.id, prayer.minRakaat);
                                    }}
                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isChecked
                                        ? 'bg-amber-500 border-amber-500'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-amber-400'
                                        }`}
                                >
                                    {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>

                                {/* Content */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => toggleExpansion(prayer.id)}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(prayer.id, prayer.minRakaat);
                                        setExpandedItems(prev => prev.filter(i => i !== prayer.id));
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`${isChecked ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {getIcon(prayer.id)}
                                            </span>
                                            <h4 className={`font-bold text-sm ${isChecked ? 'text-amber-900 dark:text-amber-100' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {t.sunnah?.prayers?.[prayer.id as keyof typeof t.sunnah.prayers]?.name || prayer.name}
                                            </h4>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isChecked
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                            {currentRakaat} rakaat
                                        </span>
                                    </div>

                                    <p className={`text-xs ${isChecked ? 'text-amber-700/60 dark:text-amber-300/60' : 'text-slate-400'}`}>
                                        {t.sunnah?.prayers?.[prayer.id as keyof typeof t.sunnah.prayers]?.timeWindow || prayer.timeWindow}
                                    </p>

                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                                {t.sunnah?.prayers?.[prayer.id as keyof typeof t.sunnah.prayers]?.description || prayer.description}
                                            </p>

                                            {/* Rakaat selector */}
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-500">Rakaat:</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (currentRakaat > prayer.minRakaat) {
                                                                updateRakaat(prayer.id, currentRakaat - 2, date);
                                                            }
                                                        }}
                                                        disabled={currentRakaat <= prayer.minRakaat}
                                                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-sm">{currentRakaat}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (currentRakaat < prayer.maxRakaat) {
                                                                updateRakaat(prayer.id, currentRakaat + 2, date);
                                                            }
                                                        }}
                                                        disabled={currentRakaat >= prayer.maxRakaat}
                                                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-slate-400">
                                                    ({prayer.minRakaat}-{prayer.maxRakaat})
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end mt-2">
                                        <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
