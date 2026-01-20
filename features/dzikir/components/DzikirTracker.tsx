
import React, { useState } from 'react';
import { useDzikir } from '../hooks/useDzikir';
import { Check, Sun, Moon, List, ChevronDown } from 'lucide-react';
import { getLocalDateStr } from '../../../shared/utils/helpers';

export const DzikirTracker: React.FC = () => {
    const { getCategories, getCategory, getSuggestedCategory, getLog, toggleItem } = useDzikir();

    const [activeCategoryId, setActiveCategoryId] = useState<string>(getSuggestedCategory());
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpansion = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Safety check if suggested category doesn't exist (though it should)
    const activeCategory = getCategory(activeCategoryId) || getCategories()[0];
    const date = getLocalDateStr();
    const log = getLog(date, activeCategory.id);
    const completedItems = log?.completedItems || [];
    const list = activeCategory.items;

    const progress = Math.round((completedItems.length / list.length) * 100);
    const isAllCompleted = completedItems.length === list.length && list.length > 0;

    const getIcon = (id: string) => {
        switch (id) {
            case 'pagi': return <Sun className="w-4 h-4" />;
            case 'petang': return <Moon className="w-4 h-4" />;
            default: return <List className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header / Category Selector */}
            <div className="flex items-center justify-between">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar max-w-[60%]">
                    {getCategories().map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategoryId(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategoryId === cat.id
                                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {getIcon(cat.id)}
                            {cat.title.replace('Dzikir ', '')}
                        </button>
                    ))}
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden xs:block">
                        <p className="text-[10px] uppercase font-black text-slate-400">Progress</p>
                        <p className={`text-sm font-black ${isAllCompleted ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {completedItems.length}/{list.length}
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
                                className={`${isAllCompleted ? 'text-emerald-500' : 'text-emerald-500'} transition-all duration-500`}
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>
                        {isAllCompleted && <Check className="absolute w-4 h-4 text-emerald-500" />}
                    </div>
                </div>
            </div>

            {/* Description */}
            {activeCategory.description && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-200">
                    {activeCategory.description}
                </div>
            )}

            {/* List */}
            <div className="grid gap-3">
                {list.map((item) => {
                    const isChecked = completedItems.includes(item.id);
                    const isExpanded = expandedItems.includes(item.id);
                    return (
                        <div
                            key={item.id}
                            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${isChecked
                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="p-4 flex items-start gap-4">
                                {/* Checkbox / Completion Toggle */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItem(item.id, activeCategory.id, date);
                                    }}
                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isChecked
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                                        }`}
                                >
                                    {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>

                                {/* Content / Expansion Toggle */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => toggleExpansion(item.id)}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`font-bold text-sm ${isChecked ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-100'}`}>
                                            {item.title}
                                        </h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isChecked
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                            {item.count}x
                                        </span>
                                    </div>
                                    <p className={`text-base leading-relaxed font-arabic mb-2 ${isChecked ? 'text-emerald-800/70 dark:text-emerald-200/50' : 'text-slate-700 dark:text-slate-300'} ${isExpanded ? '' : 'line-clamp-2'}`} dir="rtl">
                                        {item.arabic}
                                    </p>
                                    <div className="flex items-center justify-between gap-4">
                                        <p className={`text-[10px] italic ${isChecked ? 'text-emerald-700/50 dark:text-emerald-300/30' : 'text-slate-400 dark:text-slate-500'} ${isExpanded ? '' : 'line-clamp-1'}`}>
                                            {item.translation}
                                        </p>
                                        <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {list.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                    Belum ada item dzikir untuk kategori ini.
                </div>
            )}
        </div>
    );
};
