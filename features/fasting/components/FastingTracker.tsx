
import React, { useState, useEffect } from "react";
import { HijriDate, FastingType } from "../../../shared/types";
import { useLanguage } from "../../../shared/hooks/useLanguage";
import { useFastingLogs } from "../hooks/useFastingLogs";
import { getFastingRecommendation } from "../services/fastingService";
import { Moon, Check, Info, Star, RotateCcw, Target, Settings, X, Plus, Trash2, ChevronLeft, ChevronRight, MoonStar } from "lucide-react";
import { Button } from "../../../shared/components/ui/Button";
import { STORAGE_KEYS } from "../../../shared/constants";
import { useStarAnimation } from "../../gamification/context/GamificationContext";
import { calculateFastingPoints } from "../../gamification/services/gamificationService";
import { DEFAULT_GAMIFICATION_CONFIG, GamificationConfig } from "../../../shared/types";

interface FastingTrackerProps {
    currentDate: string; // YYYY-MM-DD
    hijriDate?: HijriDate;
    gamificationConfig: GamificationConfig;
}

interface FastingPreferenceConfig {
    types: FastingType[];
    days: number[]; // 0-6, 0=Sunday
    customDates: string[];
}

const STORAGE_KEY_NADZAR_CONFIG = STORAGE_KEYS.NADZAR_CONFIG;
const STORAGE_KEY_QADHA_CONFIG = STORAGE_KEYS.QADHA_CONFIG;

export const FastingTracker: React.FC<FastingTrackerProps> = ({ currentDate, hijriDate, gamificationConfig }) => {
    const { t, language } = useLanguage();
    const { getLogForDate, logFasting, removeFastingLog } = useFastingLogs();
    const { triggerAnimation } = useStarAnimation();
    const [recommendation, setRecommendation] = useState<{ type: string | null; labelKey: string; isForbidden?: boolean }>({ type: null, labelKey: '' });
    const [selectedType, setSelectedType] = useState<FastingType | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [activeConfigTab, setActiveConfigTab] = useState<'nadzar' | 'qadha' | 'ramadhan'>('nadzar');

    // Ramadhan Configuration State
    const [ramadhanConfig, setRamadhanConfig] = useState<{ startDate: string; endDate: string }>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.RAMADHAN_CONFIG);
        return saved ? JSON.parse(saved) : { startDate: '', endDate: '' };
    });

    // Nadzar Configuration State
    const [nadzarConfig, setNadzarConfig] = useState<FastingPreferenceConfig>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_NADZAR_CONFIG);
        return saved ? JSON.parse(saved) : { types: [], days: [], customDates: [] };
    });

    // Qadha Configuration State
    const [qadhaConfig, setQadhaConfig] = useState<FastingPreferenceConfig>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_QADHA_CONFIG);
        return saved ? JSON.parse(saved) : { types: [], days: [], customDates: [] };
    });

    // Temporary config for editing
    const [tempNadzar, setTempNadzar] = useState<FastingPreferenceConfig>({ types: [], days: [], customDates: [] });
    const [tempQadha, setTempQadha] = useState<FastingPreferenceConfig>({ types: [], days: [], customDates: [] });
    const [tempRamadhan, setTempRamadhan] = useState<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });

    // Helpers to access current active temp config
    const tempConfig = activeConfigTab === 'nadzar' ? tempNadzar : tempQadha;
    const setTempConfig = (updater: (prev: FastingPreferenceConfig) => FastingPreferenceConfig) => {
        if (activeConfigTab === 'nadzar') setTempNadzar(updater);
        else if (activeConfigTab === 'qadha') setTempQadha(updater);
    };

    const [calendarDate, setCalendarDate] = useState(new Date());

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_NADZAR_CONFIG, JSON.stringify(nadzarConfig));
    }, [nadzarConfig]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_QADHA_CONFIG, JSON.stringify(qadhaConfig));
    }, [qadhaConfig]);

    useEffect(() => {
        const handleConfigUpdate = () => {
            const savedNadzar = localStorage.getItem(STORAGE_KEY_NADZAR_CONFIG);
            if (savedNadzar) setNadzarConfig(JSON.parse(savedNadzar));
            const savedQadha = localStorage.getItem(STORAGE_KEY_QADHA_CONFIG);
            if (savedQadha) setQadhaConfig(JSON.parse(savedQadha));
            const savedRamadhan = localStorage.getItem(STORAGE_KEYS.RAMADHAN_CONFIG);
            if (savedRamadhan) setRamadhanConfig(JSON.parse(savedRamadhan));
        };

        const handleOpenSettings = () => {
            openConfig();
        };

        window.addEventListener('fasting_config_updated', handleConfigUpdate);
        window.addEventListener('nadzar_config_updated', handleConfigUpdate);
        window.addEventListener('qadha_config_updated', handleConfigUpdate);
        window.addEventListener('ramadhan_config_updated', handleConfigUpdate);
        window.addEventListener('open_fasting_settings', handleOpenSettings);

        return () => {
            window.removeEventListener('fasting_config_updated', handleConfigUpdate);
            window.removeEventListener('nadzar_config_updated', handleConfigUpdate);
            window.removeEventListener('qadha_config_updated', handleConfigUpdate);
            window.removeEventListener('ramadhan_config_updated', handleConfigUpdate);
            window.removeEventListener('open_fasting_settings', handleOpenSettings);
        };
    }, []);

    const todayLog = getLogForDate(currentDate);

    useEffect(() => {
        if (hijriDate && currentDate) {
            const rec = getFastingRecommendation(new Date(currentDate), hijriDate);
            setRecommendation(rec);
        }
    }, [currentDate, hijriDate, todayLog, nadzarConfig, qadhaConfig, ramadhanConfig]);

    // Check if today matches Nadzar criteria
    const checkIsNadzar = (date: string, type: FastingType | null) => {
        const dateObj = new Date(date);
        const day = dateObj.getDay();

        // Check days (e.g. Saturday)
        if (nadzarConfig.days.includes(day)) return true;

        // Check specific dates
        if (nadzarConfig.customDates.includes(date)) return true;

        // Check types (e.g. Senin-Kamis is also Nadzar)
        if (type && nadzarConfig.types.includes(type)) return true;

        return false;
    };

    const checkIsQadha = (date: string, type: FastingType | null) => {
        const dateObj = new Date(date);
        const day = dateObj.getDay();

        if (qadhaConfig.days.includes(day)) return true;
        if (qadhaConfig.customDates.includes(date)) return true;
        if (type && qadhaConfig.types.includes(type)) return true;

        return false;
    };

    const handleToggle = () => {
        if (todayLog) {
            removeFastingLog(currentDate);
            setSelectedType(null);
        } else {
            let typeToLog = (selectedType as FastingType) || (recommendation.type as FastingType);

            if (typeToLog) {
                const isNadzarMatch = checkIsNadzar(currentDate, typeToLog);
                const isQadhaMatch = checkIsQadha(currentDate, typeToLog);

                // If the type is implicitly Nadzar (e.g. user selected Nadzar type), ensure flag is true
                const finalIsNadzar = isNadzarMatch || typeToLog === 'Nadzar';
                const finalIsQadha = isQadhaMatch || typeToLog === 'Qadha';

                logFasting(currentDate, typeToLog, true, finalIsNadzar, finalIsQadha);
            } else {
                setIsDropdownOpen(prev => !prev);
            }
        }
    };

    const handleSelectType = (type: FastingType) => {
        setSelectedType(type);
        const isNadzar = checkIsNadzar(currentDate, type);
        const finalIsNadzar = isNadzar || type === 'Nadzar';
        logFasting(currentDate, type, true, finalIsNadzar);
        setIsDropdownOpen(false);

        // Trigger animation after selection
        const points = calculateFastingPoints({ type: type, isCompleted: true, date: currentDate } as any, gamificationConfig);
        triggerAnimation(null, points > 0 ? points : 12);
    };

    const openConfig = () => {
        setTempNadzar(nadzarConfig);
        setTempQadha(qadhaConfig);
        setTempRamadhan(ramadhanConfig);
        setIsConfigOpen(true);
    };

    // Config Handlers (Edit Temp)
    const toggleNadzarType = (type: FastingType) => {
        const isAdding = !tempConfig.types.includes(type);
        if (isAdding) {
            const opposingConfig = activeConfigTab === 'nadzar' ? tempQadha : tempNadzar;
            const setOpposing = activeConfigTab === 'nadzar' ? setTempQadha : setTempNadzar;
            const opposingLabel = activeConfigTab === 'nadzar' ? 'Qadha' : 'Nadzar';
            const currentLabel = activeConfigTab === 'nadzar' ? 'Nadzar' : 'Qadha';

            if (opposingConfig.types.includes(type)) {
                if (!window.confirm(`Jenis puasa ini sudah diatur sebagai ${opposingLabel}. Pindahkan ke ${currentLabel}?`)) return;
                setOpposing(prev => ({ ...prev, types: prev.types.filter(t => t !== type) }));
            }
        }

        setTempConfig(prev => ({
            ...prev,
            types: prev.types.includes(type) ? prev.types.filter(t => t !== type) : [...prev.types, type]
        }));
    };

    const toggleNadzarDay = (day: number) => {
        const isAdding = !tempConfig.days.includes(day);
        if (isAdding) {
            const opposingConfig = activeConfigTab === 'nadzar' ? tempQadha : tempNadzar;
            const setOpposing = activeConfigTab === 'nadzar' ? setTempQadha : setTempNadzar;
            const opposingLabel = activeConfigTab === 'nadzar' ? 'Qadha' : 'Nadzar';
            const currentLabel = activeConfigTab === 'nadzar' ? 'Nadzar' : 'Qadha';

            if (opposingConfig.days.includes(day)) {
                if (!window.confirm(`Hari ini sudah diatur sebagai ${opposingLabel}. Pindahkan ke ${currentLabel}?`)) return;
                setOpposing(prev => ({ ...prev, days: prev.days.filter(d => d !== day) }));
            }
        }

        setTempConfig(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
        }));
    };

    const toggleCustomDate = (date: string) => {
        const isAdding = !tempConfig.customDates.includes(date);
        if (isAdding) {
            const opposingConfig = activeConfigTab === 'nadzar' ? tempQadha : tempNadzar;
            const setOpposing = activeConfigTab === 'nadzar' ? setTempQadha : setTempNadzar;
            const opposingLabel = activeConfigTab === 'nadzar' ? 'Qadha' : 'Nadzar';
            const currentLabel = activeConfigTab === 'nadzar' ? 'Nadzar' : 'Qadha';

            if (opposingConfig.customDates.includes(date)) {
                if (!window.confirm(`Tanggal ini sudah diatur sebagai ${opposingLabel}. Pindahkan ke ${currentLabel}?`)) return;
                setOpposing(prev => ({ ...prev, customDates: prev.customDates.filter(d => d !== date) }));
            }
        }

        setTempConfig(prev => ({
            ...prev,
            customDates: prev.customDates.includes(date)
                ? prev.customDates.filter(d => d !== date)
                : [...prev.customDates, date]
        }));
    };



    const removeCustomDate = (date: string) => {
        setTempConfig(prev => ({ ...prev, customDates: prev.customDates.filter(d => d !== date) }));
    };

    const handleSaveConfig = () => {
        // Persist BOTH configs to ensure conflict resolution (removals) are saved
        localStorage.setItem(STORAGE_KEY_NADZAR_CONFIG, JSON.stringify(tempNadzar));
        localStorage.setItem(STORAGE_KEY_QADHA_CONFIG, JSON.stringify(tempQadha));
        localStorage.setItem(STORAGE_KEYS.RAMADHAN_CONFIG, JSON.stringify(tempRamadhan));

        setNadzarConfig(tempNadzar);
        setQadhaConfig(tempQadha);
        setRamadhanConfig(tempRamadhan);

        setIsConfigOpen(false);

        // Force refresh Stats for all
        window.dispatchEvent(new Event('nadzar_config_updated'));
        window.dispatchEvent(new Event('qadha_config_updated'));
        window.dispatchEvent(new Event('ramadhan_config_updated'));
    };

    const handleResetConfig = () => {
        if (activeConfigTab === 'ramadhan') {
            setTempRamadhan({ startDate: '', endDate: '' });
        } else {
            setTempConfig(() => ({ types: [], days: [], customDates: [] }));
        }
    };

    // Helper to get recommendation label
    // ... (keep existing helper)
    const getRecommendationLabel = () => {
        if (!recommendation.type) return '';
        if (recommendation.type === 'Senin-Kamis') {
            return new Date(currentDate).getDay() === 1 ? t.fasting.types.monday : t.fasting.types.thursday;
        }
        if (recommendation.type === 'Nadzar') return t.fasting.types.nadzar;
        if (recommendation.type === 'Qadha') return t.fasting.types.qadha;
        if (recommendation.type === 'Ayyamul Bidh') return t.fasting.types.midMonth;
        if (recommendation.type === 'Ramadhan') return t.fasting.types.ramadhan;
        return t.fasting.types.other;
    };

    const getLoggedLabel = () => {
        if (!todayLog) return '';
        if (todayLog.type === 'Nadzar') return t.fasting.types.nadzar;
        if (todayLog.type === 'Qadha') return t.fasting.types.qadha;
        if (todayLog.type === 'Senin-Kamis') {
            return new Date(currentDate).getDay() === 1 ? t.fasting.types.monday : t.fasting.types.thursday;
        }
        if (todayLog.type === 'Ayyamul Bidh') return t.fasting.types.midMonth;
        if (todayLog.type === 'Ramadhan') return t.fasting.types.ramadhan;
        return t.fasting.types.other;
    };

    if (!hijriDate) return null;

    return (
        <>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-visible">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Moon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t.fasting.title}</h3>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {hijriDate.day} {t.fasting.hijriMonths[hijriDate.month.number as keyof typeof t.fasting.hijriMonths]} {hijriDate.year} {hijriDate.designation.abbreviated}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openConfig}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center relative">
                    <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{t.fasting.today}</h4>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{currentDate}</p>

                    {recommendation.isForbidden ? (
                        <div className="mb-6 px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            {t.fasting.types.forbidden}
                        </div>
                    ) : recommendation.type && (
                        <div className="mb-6 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            {getRecommendationLabel()}
                            {recommendation.type !== 'Nadzar' && checkIsNadzar(currentDate, recommendation.type as FastingType) && <span className="ml-1 text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">+Nadzar <Target className="w-3 h-3" /></span>}
                            {recommendation.type !== 'Qadha' && checkIsQadha(currentDate, recommendation.type as FastingType) && <span className="ml-1 text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">+Qadha <RotateCcw className="w-3 h-3" /></span>}
                        </div>
                    )}

                    <div className="relative z-20"> {/* Button Group */}
                        {!todayLog ? (
                            <div className="flex flex-col gap-3 items-center">
                                <Button
                                    onClick={(e) => {
                                        if (!recommendation.isForbidden && !isDropdownOpen) {
                                            // Determine if this click will result in an immediate mark (has direct schedule)
                                            const immediateType = (recommendation.type as FastingType) || (checkIsNadzar(currentDate, null) ? 'Nadzar' as FastingType : null);

                                            if (immediateType) {
                                                const points = calculateFastingPoints({ type: immediateType, isCompleted: true, date: currentDate } as any, gamificationConfig);
                                                triggerAnimation(null, points > 0 ? points : 12);
                                            }
                                        }
                                        handleToggle();
                                    }}
                                    disabled={!!recommendation.isForbidden}
                                    className={`rounded-2xl ${recommendation.isForbidden ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-8 py-4 shadow-lg shadow-emerald-600/20 flex items-center gap-3 text-sm font-bold transition-all transform hover:scale-105`}
                                >
                                    {recommendation.isForbidden ? <Info className="w-5 h-5" /> :
                                        (recommendation.type === 'Qadha' || checkIsQadha(currentDate, recommendation.type as FastingType)) ? <RotateCcw className="w-5 h-5" /> :
                                            (recommendation.type === 'Nadzar' || checkIsNadzar(currentDate, recommendation.type as FastingType)) ? <Target className="w-5 h-5" /> :
                                                recommendation.type === 'Senin-Kamis' ? <Star className="w-5 h-5" /> :
                                                    recommendation.type === 'Ramadhan' ? <MoonStar className="w-5 h-5" /> :
                                                        recommendation.type === 'Ayyamul Bidh' ? <Moon className="w-5 h-5" /> :
                                                            <Check className="w-5 h-5" />}
                                    {recommendation.isForbidden ? t.fasting.actions.forbidden : (recommendation.type ? t.fasting.actions.mark : t.fasting.actions.selectType)}
                                </Button>

                                {!recommendation.type && isDropdownOpen && (
                                    <div className="absolute top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                        {['Nadzar', 'Qadha', 'Lainnya'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => handleSelectType(type as FastingType)}
                                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors"
                                            >
                                                {type === 'Nadzar' ? t.fasting.types.nadzar : type === 'Qadha' ? t.fasting.types.qadha : t.fasting.types.other}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-sm relative
                                    ${todayLog.type === 'Nadzar' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                                        todayLog.type === 'Qadha' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' :
                                            'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'}
                                `}>
                                    {todayLog.type === 'Nadzar' && <Target className="w-8 h-8" />}
                                    {todayLog.type === 'Qadha' && <RotateCcw className="w-8 h-8" />}
                                    {todayLog.type === 'Senin-Kamis' && <Star className="w-8 h-8" />}
                                    {todayLog.type === 'Ramadhan' && <MoonStar className="w-8 h-8" />}
                                    {['Ayyamul Bidh', 'Lainnya'].includes(todayLog.type) && <Moon className="w-8 h-8" />}

                                    {/* Nadzar Badge */}
                                    {todayLog.isNadzar && todayLog.type !== 'Nadzar' && (
                                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
                                            <Target className="w-3 h-3" />
                                        </div>
                                    )}
                                    {todayLog.isQadha && todayLog.type !== 'Qadha' && (
                                        <div className="absolute -top-1 -left-1 bg-rose-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
                                            <RotateCcw className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-center">
                                    <p className={`font-black text-lg
                                        ${todayLog.type === 'Nadzar' ? 'text-amber-600 dark:text-amber-400' :
                                            todayLog.type === 'Qadha' ? 'text-rose-600 dark:text-rose-400' :
                                                'text-emerald-600 dark:text-emerald-400'}
                                    `}>
                                        {getLoggedLabel()}
                                    </p>
                                    {todayLog.isNadzar && todayLog.type !== 'Nadzar' && (
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                                            + {t.fasting.types.nadzar}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={handleToggle}
                                    className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors mt-2 underline"
                                >
                                    {t.fasting.actions.unmark}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* Fasting Settings Modal */}
            {
                isConfigOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="flex-1 text-lg font-black text-slate-800 dark:text-slate-100">{t.fasting.config.title}</h3>
                                <button onClick={() => setIsConfigOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                                <button
                                    onClick={() => setActiveConfigTab('nadzar')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeConfigTab === 'nadzar'
                                        ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    {t.fasting.config.nadzar}
                                </button>
                                <button
                                    onClick={() => setActiveConfigTab('qadha')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeConfigTab === 'qadha'
                                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    {t.fasting.config.qadha}
                                </button>
                                <button
                                    onClick={() => setActiveConfigTab('ramadhan')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeConfigTab === 'ramadhan'
                                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    {t.fasting.config.ramadhan}
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto flex-1 pr-2">
                                {activeConfigTab === 'ramadhan' ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                                                <MoonStar className="w-8 h-8 text-emerald-600" />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest text-xs mb-1">{t.fasting.config.ramadhan}</h4>
                                                <p className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/60 leading-relaxed uppercase tracking-tighter">Atur periode bulan suci untuk penanda otomatis</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.fasting.config.ramadhanStart}</label>
                                                <div className="relative group">
                                                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                    <input
                                                        type="date"
                                                        value={tempRamadhan.startDate}
                                                        onChange={(e) => setTempRamadhan(prev => ({ ...prev, startDate: e.target.value }))}
                                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t.fasting.config.ramadhanEnd}</label>
                                                <div className="relative group">
                                                    <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                                    <input
                                                        type="date"
                                                        value={tempRamadhan.endDate}
                                                        onChange={(e) => setTempRamadhan(prev => ({ ...prev, endDate: e.target.value }))}
                                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Auto-check Types */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">
                                                {t.fasting.config.computeAs.replace('{type}', activeConfigTab === 'nadzar' ? t.fasting.config.nadzar : t.fasting.config.qadha)}
                                            </h4>
                                            <div className="space-y-3">
                                                {[
                                                    { id: 'Senin-Kamis', label: t.fasting.types.mondayThursdayShort, icon: Star },
                                                    { id: 'Ayyamul Bidh', label: t.fasting.types.midMonth, icon: Moon }
                                                ].map((item) => (
                                                    <label key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${tempConfig.types.includes(item.id as FastingType)
                                                            ? activeConfigTab === 'nadzar' ? 'bg-amber-500 border-amber-500' : 'bg-rose-500 border-rose-500'
                                                            : 'border-slate-300 dark:border-slate-600'
                                                            }`}>
                                                            {tempConfig.types.includes(item.id as FastingType) && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={tempConfig.types.includes(item.id as FastingType)}
                                                            onChange={() => toggleNadzarType(item.id as FastingType)}
                                                        />
                                                        <item.icon className={`w-5 h-5 ${activeConfigTab === 'nadzar' ? 'text-amber-500' : 'text-rose-500'}`} />
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recurring Days */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">{t.fasting.config.specialDays}</h4>
                                            <div className="grid grid-cols-7 gap-2">
                                                {Object.keys(t.fasting.days).map((key, idx) => {
                                                    const isSelected = tempConfig.days.includes(idx);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => toggleNadzarDay(idx)}
                                                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${isSelected
                                                                ? activeConfigTab === 'nadzar'
                                                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                                                    : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                }`}
                                                        >
                                                            <span>{Object.values(t.fasting.days)[idx]}</span>
                                                            {isSelected && <Check className="w-3 h-3" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Custom Dates - Calendar Picker */}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">{t.fasting.config.specialDates}</h4>

                                            {/* Calendar UI */}
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                                {/* Calendar Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <button
                                                        onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                                                    </button>
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                                                        {calendarDate.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' })}
                                                    </span>
                                                    <button
                                                        onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                                    </button>
                                                </div>

                                                {/* Calendar Grid */}
                                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                                    {Object.values(t.fasting.days).map((d: string, i) => (
                                                        <div key={i} className="text-[10px] font-black text-slate-400">{d.charAt(0)}</div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {Array.from({ length: 42 }).map((_, i) => {
                                                        const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                                                        const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i - firstDayOfMonth + 1);
                                                        const dateStr = date.toISOString().split('T')[0];
                                                        const isSelected = tempConfig.customDates.includes(dateStr);
                                                        const isCurrentMonth = date.getMonth() === calendarDate.getMonth();

                                                        if (!isCurrentMonth) return <div key={i} />;

                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => toggleCustomDate(dateStr)}
                                                                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all relative
                                                            ${isSelected
                                                                        ? activeConfigTab === 'nadzar'
                                                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                                                            : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'}
                                                        `}
                                                            >
                                                                {date.getDate()}
                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1">
                                                                        {activeConfigTab === 'nadzar' ? (
                                                                            <Target className="w-3 h-3 text-amber-100" />
                                                                        ) : (
                                                                            <RotateCcw className="w-3 h-3 text-rose-100" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="mt-2 text-center">
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {tempConfig.customDates.length > 0
                                                        ? t.fasting.config.selectedDates.replace('{count}', tempConfig.customDates.length.toString())
                                                        : t.fasting.config.selectOnCalendar}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <button
                                    onClick={handleResetConfig}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                >
                                    {t.fasting.config.resetTab}
                                </button>
                                <button
                                    onClick={handleSaveConfig}
                                    className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${activeConfigTab === 'nadzar' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                                        activeConfigTab === 'ramadhan' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                                            'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                                        }`}
                                >
                                    {t.fasting.config.saveConfig.replace('{type}', activeConfigTab === 'nadzar' ? t.fasting.config.nadzar : activeConfigTab === 'ramadhan' ? t.fasting.config.ramadhan : t.fasting.config.qadha)}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
};
