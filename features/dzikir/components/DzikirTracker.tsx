
import React, { useState } from 'react';
import { useDzikir } from '../hooks/useDzikir';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { Check, Sun, Moon, List, ChevronDown, Maximize2, Minimize2, CheckCircle, ArrowDown, ChevronsUp, ChevronsDown, Plus, Minus, RotateCcw } from 'lucide-react';
import { getLocalDateStr } from '../../../shared/utils/helpers';
import { useStarAnimation } from '../../gamification/context/GamificationContext';
import { calculateDzikirPoints } from '../../gamification/services/gamificationService';
import { DEFAULT_GAMIFICATION_CONFIG, GamificationConfig } from '../../../shared/types';

interface DzikirTrackerProps {
    gamificationConfig: GamificationConfig;
}

export const DzikirTracker: React.FC<DzikirTrackerProps> = ({ gamificationConfig }) => {
    const { getCategories, getCategory, getSuggestedCategory, getLog, toggleItem } = useDzikir();
    const { t } = useLanguage();
    const { triggerAnimation } = useStarAnimation();

    const [activeCategoryId, setActiveCategoryId] = useState<string>(getSuggestedCategory());
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [fontSize, setFontSize] = useState(20);
    const [showFontControls, setShowFontControls] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const bottomRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            const isScrollable = scrollHeight > clientHeight + 100;

            if (!bottomRef.current) {
                setShowScrollBtn(false);
                return;
            }

            const rect = bottomRef.current.getBoundingClientRect();
            // Hide button when the bottom of the page is visible within viewport
            const hasReachedBottom = rect.top < window.innerHeight + 100;

            setShowScrollBtn(isScrollable && !hasReachedBottom);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        // Check initially
        const timer = setTimeout(handleScroll, 200);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            clearTimeout(timer);
        };
    }, [activeCategoryId]);

    const toggleExpansion = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllExpansion = () => {
        if (expandedItems.length === list.length) {
            setExpandedItems([]);
        } else {
            setExpandedItems(list.map(i => i.id));
        }
    };

    const scrollToLatestMarked = () => {
        if (completedItems.length === 0) return;

        // Find the last completed item based on the list order
        const lastMarkedItem = [...list].reverse().find(item => completedItems.includes(item.id));

        if (lastMarkedItem) {
            const element = document.getElementById(`dzikir-item-${lastMarkedItem.id}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const scrollToBottom = () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
                            {cat.id === 'pagi' ? t.dzikir.morning : cat.id === 'petang' ? t.dzikir.evening : cat.title}
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
            {(activeCategory.description || (activeCategory.id === 'pagi' || activeCategory.id === 'petang')) && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-200">
                    {activeCategory.id === 'pagi' ? t.dzikir.morningDesc : activeCategory.id === 'petang' ? t.dzikir.eveningDesc : activeCategory.description}
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
                            id={`dzikir-item-${item.id}`}
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
                                        e.preventDefault();
                                        if (!isChecked) {
                                            const points = calculateDzikirPoints({ categoryId: activeCategory.id, isCompleted: true, date: date } as any, gamificationConfig);
                                            // Give points per individual item (divide total by item count)
                                            const perItemPoints = Math.ceil(points / list.length) || 2;
                                            triggerAnimation(null, perItemPoints);

                                            // Bonus +10 when all dzikir are completed
                                            if (completedItems.length === list.length - 1) {
                                                setTimeout(() => triggerAnimation(null, 10), 300);
                                            }
                                        }
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
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (!isChecked) {
                                            const points = calculateDzikirPoints({ categoryId: activeCategory.id, isCompleted: true, date: date } as any, gamificationConfig);
                                            // Give points per individual item (divide total by item count)
                                            const perItemPoints = Math.ceil(points / list.length) || 2;
                                            triggerAnimation(null, perItemPoints);

                                            // Bonus +10 when all dzikir are completed
                                            if (completedItems.length === list.length - 1) {
                                                setTimeout(() => triggerAnimation(null, 10), 300);
                                            }
                                        }
                                        toggleItem(item.id, activeCategory.id, date);
                                        // Automatically collapse when marked
                                        setExpandedItems(prev => prev.filter(i => i !== item.id));
                                    }}
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
                                    <p
                                        className={`leading-relaxed font-arabic mb-2 ${isChecked ? 'text-emerald-800/70 dark:text-emerald-200/50' : 'text-slate-700 dark:text-slate-300'} ${isExpanded ? '' : 'line-clamp-2'}`}
                                        style={{ fontSize: `${fontSize}px` }}
                                        dir="rtl"
                                    >
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
            {/* Floating Action Buttons */}
            <div className="fixed bottom-28 lg:bottom-10 right-6 lg:right-10 z-50 mb-6 flex flex-col items-end gap-3">
                {/* Buttons Container */}
                <div className={`flex flex-col gap-3 transition-all duration-200 origin-bottom items-end ${isMobileMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none lg:opacity-100 lg:scale-100 lg:translate-y-0 lg:pointer-events-auto'
                    }`}>
                    {/* Font Size Controls */}
                    <div className="flex flex-col gap-2 items-end">
                        {showFontControls && (
                            <div className="flex flex-col gap-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 animate-in slide-in-from-right-4 fade-in duration-200">
                                <button
                                    onClick={() => setFontSize(prev => Math.min(prev + 2, 40))}
                                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                    title="Increase Font Size"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <div className="h-[1px] bg-slate-100 dark:bg-slate-700 mx-2" />
                                <button
                                    onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
                                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                    title="Decrease Font Size"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <div className="h-[1px] bg-slate-100 dark:bg-slate-700 mx-2" />
                                <button
                                    onClick={() => setFontSize(20)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
                                    title="Reset Font Size"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setShowFontControls(!showFontControls)}
                            className={`w-12 h-12 rounded-full shadow-lg border flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${showFontControls
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                            title="Font Settings"
                        >
                            <span className="text-2xl" style={{ fontFamily: '"Times New Roman", Times, serif' }}>A</span>
                        </button>
                    </div>

                    {/* Expand/Collapse All */}
                    <button
                        onClick={toggleAllExpansion}
                        className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                        title={expandedItems.length === list.length ? "Collapse All" : "Expand All"}
                    >
                        {expandedItems.length === list.length ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>

                    {/* Scroll to Latest Marked */}
                    {completedItems.length > 0 && (
                        <button
                            onClick={scrollToLatestMarked}
                            className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full shadow-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                            title="Scroll to Latest Marked"
                        >
                            <CheckCircle className="w-5 h-5" />
                        </button>
                    )}

                    {/* Scroll to Bottom */}
                    <button
                        onClick={scrollToBottom}
                        className={`w-12 h-12 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all ${showScrollBtn ? '' : 'hidden lg:flex lg:opacity-50 lg:hover:opacity-100'}`}
                        title="Scroll to Bottom"
                    >
                        <ChevronDown className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile Toggle Button */}
                <div className="lg:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                        className={`w-12 h-12 rounded-full shadow-lg border flex items-center justify-center transition-all ${isMobileMenuOpen
                            ? 'bg-slat-100 border-slate-200 text-slate-500 rotate-45'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Sentinel for bottom detection */}
            <div ref={bottomRef} className="h-24 lg:h-10" />
        </div>
    );
};
