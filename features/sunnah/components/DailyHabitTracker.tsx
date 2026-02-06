
import React, { useState } from 'react';
import { useDailyHabit } from '../hooks/useDailyHabit';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { Check, BookOpen, Heart, Hand, Moon, ChevronDown, Plus, Minus } from 'lucide-react';
import { getLocalDateStr } from '../../../shared/utils/helpers';
import { useStarAnimation } from '../../gamification/context/GamificationContext';
import { GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';

interface DailyHabitTrackerProps {
    gamificationConfig: GamificationConfig;
}

export const DailyHabitTracker: React.FC<DailyHabitTrackerProps> = ({
    gamificationConfig = DEFAULT_GAMIFICATION_CONFIG
}) => {
    const { getHabits, getLog, toggleHabit, updateValue } = useDailyHabit();
    const { t } = useLanguage();
    const { triggerAnimation } = useStarAnimation();

    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const date = getLocalDateStr();
    const habits = getHabits();

    const completedCount = habits.filter(h => {
        const log = getLog(date, h.id);
        if (h.type === 'checkbox') return log?.value === true;
        return typeof log?.value === 'number' && log.value > 0;
    }).length;

    const progress = Math.round((completedCount / habits.length) * 100);
    const isAllCompleted = completedCount === habits.length && habits.length > 0;

    const toggleExpansion = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleToggle = (habitId: string) => {
        const log = getLog(date, habitId);
        const habit = habits.find(h => h.id === habitId);
        const isCurrentlyCompleted = habit?.type === 'checkbox'
            ? log?.value === true
            : typeof log?.value === 'number' && log.value > 0;

        // Trigger animation for each individual item when checked
        if (!isCurrentlyCompleted) {
            const points = gamificationConfig?.points?.dailyHabit?.[habitId as keyof typeof gamificationConfig.points.dailyHabit] || 5;
            triggerAnimation(null, points);

            if (completedCount === habits.length - 1) {
                const bonusPoints = gamificationConfig?.points?.dailyHabit?.bonusPerfect || 10;
                setTimeout(() => triggerAnimation(null, bonusPoints), 300);
            }
        }

        if (habit?.type === 'checkbox') {
            toggleHabit(habitId, true, date);
        } else {
            // For counter type, toggle sets initial value or clears
            if (isCurrentlyCompleted) {
                updateValue(habitId, 0, date);
            } else {
                updateValue(habitId, habit?.targetCount || 1, date);
            }
        }
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'tilawah': return <BookOpen className="w-4 h-4" />;
            case 'shalawat': return <Heart className="w-4 h-4" />;
            case 'sedekah': return <Hand className="w-4 h-4" />;
            case 'doaTidur': return <Moon className="w-4 h-4" />;
            default: return <Check className="w-4 h-4" />;
        }
    };

    const isHabitCompleted = (habitId: string) => {
        const habit = habits.find(h => h.id === habitId);
        const log = getLog(date, habitId);
        if (habit?.type === 'checkbox') return log?.value === true;
        return typeof log?.value === 'number' && log.value > 0;
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                        {t.sunnah?.habits?.title || 'Ibadah Harian'}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        {t.sunnah?.habits?.subtitle || 'Kebiasaan baik setiap hari'}
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden xs:block">
                        <p className="text-[10px] uppercase font-black text-slate-400">Progress</p>
                        <p className={`text-sm font-black ${isAllCompleted ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {completedCount}/{habits.length}
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
                                className="text-indigo-500 transition-all duration-500"
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>
                        {isAllCompleted && <Check className="absolute w-4 h-4 text-indigo-500" />}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-3">
                {habits.map((habit) => {
                    const log = getLog(date, habit.id);
                    const isChecked = isHabitCompleted(habit.id);
                    const currentValue = typeof log?.value === 'number' ? log.value : 0;
                    const isExpanded = expandedItems.includes(habit.id);

                    return (
                        <div
                            key={habit.id}
                            id={`daily-habit-${habit.id}`}
                            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${isChecked
                                ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="p-4 flex items-start gap-4">
                                {/* Checkbox */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(habit.id);
                                    }}
                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isChecked
                                        ? 'bg-indigo-500 border-indigo-500'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                                        }`}
                                >
                                    {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>

                                {/* Content */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => toggleExpansion(habit.id)}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(habit.id);
                                        setExpandedItems(prev => prev.filter(i => i !== habit.id));
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`${isChecked ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {getIcon(habit.id)}
                                            </span>
                                            <h4 className={`font-bold text-sm ${isChecked ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {t.sunnah?.habits?.[habit.id as keyof typeof t.sunnah.habits]?.name || habit.name}
                                            </h4>
                                        </div>
                                        {habit.type === 'counter' && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isChecked
                                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                {currentValue} {t.sunnah?.habits?.[habit.id as keyof typeof t.sunnah.habits]?.unit || habit.unit}
                                            </span>
                                        )}
                                    </div>

                                    <p className={`text-xs ${isChecked ? 'text-indigo-700/60 dark:text-indigo-300/60' : 'text-slate-400'}`}>
                                        {t.sunnah?.habits?.[habit.id as keyof typeof t.sunnah.habits]?.description || habit.description}
                                    </p>

                                    {isExpanded && habit.type === 'counter' && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-500">{t.sunnah?.habits?.[habit.id as keyof typeof t.sunnah.habits]?.unit || habit.unit}:</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (currentValue > 0) {
                                                                updateValue(habit.id, currentValue - 1, date);
                                                            }
                                                        }}
                                                        disabled={currentValue <= 0}
                                                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-sm">{currentValue}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateValue(habit.id, currentValue + 1, date);
                                                        }}
                                                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
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
