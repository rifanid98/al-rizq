
import React, { useMemo, useState, useEffect } from 'react';
import { useLanguage } from "../../../shared/hooks/useLanguage";
import { useFastingLogs } from "../hooks/useFastingLogs";
import {
    getHijriDate,
    getProhibitedFastingReason,
    getAsyncMonthForecast,
    getAsyncHijriMonthForecast
} from '../services/fastingService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar as CalendarIcon, Info, Star, RotateCcw, Moon, Target, TrendingUp, MoonStar, ChevronLeft, ChevronRight, XCircle, Loader2, ArrowLeftRight } from 'lucide-react';
import { HijriDate, FastingType } from '../../../shared/types';
import { getLocalDateStr } from '../../../shared/utils/helpers';
import { STORAGE_KEYS } from '../../../shared/constants';

import { useFastingStore } from '../stores/useFastingStore';
import { FastingPreferenceConfig as NadzarConfig } from '../../../shared/types'; // Using reuse of type properly


interface FastingStatsProps {
    hijriDate?: HijriDate;
    minimal?: boolean; // If true, hides Performance and Distribution sections
}

export const FastingStats: React.FC<FastingStatsProps> = ({ hijriDate, minimal = false }) => {
    const { t, language } = useLanguage();
    const { getLogStats, fastingLogs } = useFastingLogs();
    const stats = getLogStats();

    // Nadzar Config State
    const nadzarConfig = useFastingStore((state) => state.nadzarConfig);
    const qadhaConfig = useFastingStore((state) => state.qadhaConfig);
    const ramadhanConfig = useFastingStore((state) => state.ramadhanConfig);

    // Data for Charts
    const data = [
        { name: 'Sunnah', value: stats.sunnah, color: '#10B981' }, // Emerald 500
        { name: 'Nadzar', value: stats.nadzar, color: '#F59E0B' }, // Amber 500
        { name: 'Qadha', value: stats.qadha, color: '#F43F5E' }, // Rose 500
    ].filter(d => d.value > 0);

    // Date Navigation State
    const [displayedDate, setDisplayedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'gregorian' | 'hijri'>('gregorian');

    // Hijri Navigation State (Initialize with current Hijri date approximation)
    const [hijriNavDate, setHijriNavDate] = useState<{ month: number, year: number }>(() => {
        const h = getHijriDate(new Date());
        return { month: h.month.number - 1, year: parseInt(h.year) }; // 0-based month internally to match Date.getMonth? Or 1-based?
        // Let's use 0-based index for consistency with Date().getMonth()
    });

    // Calculate Hijri Offset (Difference between API and Local)

    // Calculate Hijri Offset (Difference between API and Local)
    // Calculate Hijri Offset (Difference between API and Local)
    const hijriOffset = useMemo(() => {
        // If Manual Config exists, we trust our local calculation (which includes manual offset)
        // and ignore the API date to prevent it from "undoing" our manual shift.
        if (ramadhanConfig.startDate || ramadhanConfig.endDate) {
            return 0;
        }

        if (!hijriDate) return 0;
        const now = new Date();
        // Get local prediction for TODAY (not displayedDate)
        const local = getHijriDate(now);

        // Only adjust if months match to avoid complex month-boundary math errors
        // If they differ, the offset is likely too large or caused by month boundary skew
        if (local.month.number !== hijriDate.month.number) return 0;

        return parseInt(hijriDate.day) - parseInt(local.day);
    }, [hijriDate, ramadhanConfig]);

    // Monthly Forecast Calendar
    const [currentMonthForecast, setCurrentMonthForecast] = useState<Array<{
        date: string, hijri: HijriDate, recommendation: any
    }>>([]);
    const [isLoadingForecast, setIsLoadingForecast] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchForecast() {
            setIsLoadingForecast(true);
            try {
                let data;
                if (viewMode === 'gregorian') {
                    const y = displayedDate.getFullYear();
                    const m = displayedDate.getMonth();
                    data = await getAsyncMonthForecast(y, m, hijriOffset);
                } else {
                    // Hijri Mode
                    data = await getAsyncHijriMonthForecast(hijriNavDate.year, hijriNavDate.month, hijriOffset);
                }

                if (isMounted) setCurrentMonthForecast(data);
            } catch (e) {
                console.error("Failed to fetch forecast", e);
            } finally {
                if (isMounted) setIsLoadingForecast(false);
            }
        }

        fetchForecast();

        return () => { isMounted = false; };
    }, [displayedDate, hijriNavDate, viewMode, hijriOffset, nadzarConfig, qadhaConfig, ramadhanConfig]);

    const handlePrevMonth = () => {
        if (viewMode === 'gregorian') {
            setDisplayedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        } else {
            setHijriNavDate(prev => {
                let m = prev.month - 1;
                let y = prev.year;
                if (m < 0) {
                    m = 11;
                    y--;
                }
                return { month: m, year: y };
            });
        }
    };

    const handleNextMonth = () => {
        if (viewMode === 'gregorian') {
            setDisplayedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        } else {
            setHijriNavDate(prev => {
                let m = prev.month + 1;
                let y = prev.year;
                if (m > 11) {
                    m = 0;
                    y++;
                }
                return { month: m, year: y };
            });
        }
    };

    // Reset to Today
    const handleResetToday = () => {
        if (viewMode === 'gregorian') {
            setDisplayedDate(new Date());
        } else {
            // Recalculate current hijri
            const h = getHijriDate(new Date());
            setHijriNavDate({ month: h.month.number - 1, year: parseInt(h.year) });
        }
    };

    // Hijri Month Names
    const HIJRI_MONTHS = [
        "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir",
        "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
        "Ramadhan", "Syawal", "Dzulkaidah", "Dzulhijjah"
    ];

    const isCurrentMonth = displayedDate.getMonth() === new Date().getMonth() && displayedDate.getFullYear() === new Date().getFullYear();


    // Helper to check if a date is fasted and get type
    const getFastedLog = (date: string) => fastingLogs.find(l => l.date === date);

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Fasting Performance Panel */}
            {!minimal && (
                <div className="order-last md:order-first bg-emerald-600 dark:bg-emerald-900/40 p-8 rounded-2xl shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">{t.dashboard.performance}</h3>
                            <p className="text-emerald-100 font-medium opacity-80">{t.dashboard.performanceSubtitle}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{t.fasting.stats.streak}</p>
                            <p className="text-2xl font-black">{stats.streak} <span className="text-sm font-bold opacity-60">{t.dashboard.days}</span></p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{t.fasting.stats.total}</p>
                            <p className="text-2xl font-black">{stats.total} <span className="text-sm font-bold opacity-60">{t.dashboard.days}</span></p>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-500" />
                    {t.fasting.stats.fastingSummary || 'Fasting Summary'}
                </h4>
                <div className="grid grid-cols-3 max-[574px]:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.sunnah}</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-600/60 dark:text-emerald-400/60 mt-1">{t.fasting.stats.sunnah}</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.nadzar}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-600/60 dark:text-amber-400/60 mt-1">{t.fasting.stats.nadzar}</span>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.qadha}</span>
                        {/* Placeholder for Qadha count logic if implemented later */}
                        <span className="text-[10px] uppercase font-bold text-rose-600/60 dark:text-rose-400/60 mt-1">{t.fasting.stats.qadha}</span>
                    </div>
                </div>
            </div>



            {/* Distribution Chart */}
            {!minimal && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <Info className="w-4 h-4 text-emerald-500" />
                        {t.fasting.distribution}
                    </h4>
                    <div className="h-48 w-full flex items-center justify-center relative">
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-400 text-xs font-bold">{t.dashboard.noData}</div>
                        )}
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.total}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-400">Total</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Forecast Calendar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-emerald-500" />
                        {viewMode === 'gregorian' ? t.fasting.history : 'Kalender Hijriyah'}
                    </h4>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setViewMode(prev => prev === 'gregorian' ? 'hijri' : 'gregorian'); }}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-1"
                            title="Switch Calendar View"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                        </button>

                        {!isCurrentMonth && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleResetToday(); }}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md transition-colors mr-2 animate-in fade-in"
                            >
                                {t.common.today || 'Hari Ini'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handlePrevMonth(); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <span className="text-xs font-bold text-slate-400 min-w-[100px] text-center">
                            {viewMode === 'gregorian'
                                ? displayedDate.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' })
                                : `${HIJRI_MONTHS[hijriNavDate.month]} ${hijriNavDate.year}`
                            }
                        </span>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleNextMonth(); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                    {[t.fasting.days.mon, t.fasting.days.tue, t.fasting.days.wed, t.fasting.days.thu, t.fasting.days.fri, t.fasting.days.sat, t.fasting.days.sun].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for start of month padding */}
                    {(!isLoadingForecast && currentMonthForecast.length > 0) && (() => {
                        // Padding calculation.
                        // Gregorian: based on date.getDay()
                        // Hijri: API returns "weekday.en". Or we can parse the Gregorian date of the 1st Hijri day.
                        // Wait, currentMonthForecast[0] corresponds to Index 0.
                        // For Hijri View, we still display standard Mon-Sun grid?
                        // Yes, but the 1st Hijri day might be Wednesday.
                        // We need the weekday of the FIRST day in the array.
                        // currentMonthForecast[0].date is the Gregorian Date of the first item.
                        // So getting its day is correct regardless of view mode!

                        const [year, month, day] = currentMonthForecast[0].date.split('-').map(Number);
                        const firstDay = new Date(year, month - 1, day).getDay();

                        // Default start: Monday=1...Sunday=0? Date.getDay() 0=Sun, 1=Mon.
                        // Grid header: Mon, Tue, Wed, Thu, Fri, Sat, Sun.
                        // If 1st is Monday (1), padding = 0?
                        // If grid starts with Mon:
                        // Sun(0) -> padding 6.
                        // Mon(1) -> padding 0.
                        const padding = firstDay === 0 ? 6 : firstDay - 1;
                        return Array.from({ length: padding }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ));
                    })()}

                    {isLoadingForecast && (
                        <div className="col-span-7 py-8 flex justify-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    )}

                    {currentMonthForecast.map((day) => {
                        const log = getFastedLog(day.date);
                        const isDayFasted = !!log;
                        const originalType = day.recommendation.type;
                        const effectiveType = originalType;

                        const isRecommended = !!effectiveType;
                        const isToday = day.date === getLocalDateStr();

                        return (
                            <div key={day.date} className="aspect-square relative flex items-center justify-center p-1">
                                <div className={`w-full h-full rounded-2xl flex items-center justify-center text-[10px] font-bold transition-all relative overflow-hidden
                                    ${!isDayFasted && !isRecommended && !day.recommendation.isForbidden
                                        ? 'text-slate-600 dark:text-slate-400'
                                        : (isDayFasted || isRecommended || day.recommendation.isForbidden)
                                            ? (
                                                day.recommendation.isForbidden
                                                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-500 opacity-60 cursor-pointer hover:bg-rose-200 dark:hover:bg-rose-900/60'
                                                    : (log?.type === 'Nadzar' || effectiveType === 'Nadzar' || log?.isNadzar || day.recommendation.isNadzar) ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200' :
                                                        (log?.type === 'Qadha' || effectiveType === 'Qadha' || log?.isQadha) ? 'bg-rose-500 dark:bg-rose-600 text-white shadow-md shadow-rose-500/20' :
                                                            (log?.type === 'Senin-Kamis' || effectiveType === 'Senin-Kamis') ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200' :
                                                                ['Ayyamul Bidh', 'Ramadhan', 'Lainnya'].includes(log?.type || effectiveType || '') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200' :
                                                                    'bg-slate-100 dark:bg-slate-800'
                                            )
                                            : ''
                                    }
                                    ${isToday && !isDayFasted && (!isRecommended || day.recommendation.isForbidden) ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700' : ''}
                                `}
                                    onClick={() => {
                                        if (day.recommendation.isForbidden) {
                                            const d = new Date(day.date);
                                            const reason = getProhibitedFastingReason(day.hijri, d);
                                            alert(`Tanggal ini ${day.hijri.day} ${day.hijri.month.en}: ${reason} (Diharamkan Puasa)`);
                                        }
                                    }}
                                >
                                    {(!isDayFasted && (!isRecommended || day.recommendation.isForbidden)) && (
                                        <span className="relative z-0 text-lg font-black">
                                            {viewMode === 'gregorian'
                                                ? day.date.split('-')[2] // Show Gregorian Day
                                                : day.hijri.day // Show Hijri Day
                                            }
                                        </span>
                                    )}

                                    {isDayFasted ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                            {log?.type === 'Nadzar' && <Target className="w-[60%] h-[60%]" />}
                                            {log?.type === 'Qadha' && <RotateCcw className="w-[60%] h-[60%] text-white" />}
                                            {log?.type === 'Senin-Kamis' && <Star className="w-[60%] h-[60%]" />}
                                            {log?.type === 'Ramadhan' && <MoonStar className="w-[60%] h-[60%]" />}
                                            {['Ayyamul Bidh', 'Lainnya'].includes(log?.type || '') && <Moon className="w-[60%] h-[60%]" />}
                                        </div>
                                    ) : day.recommendation.isForbidden ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                            <XCircle className="w-[50%] h-[50%] text-rose-400" />
                                        </div>
                                    ) : (
                                        isRecommended && !day.recommendation.isForbidden && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-50">
                                                {effectiveType === 'Nadzar' && <Target className="w-[60%] h-[60%] text-amber-500" />}
                                                {effectiveType === 'Qadha' && <RotateCcw className="w-[60%] h-[60%] text-white" />}
                                                {effectiveType === 'Senin-Kamis' && <Star className={`w-[60%] h-[60%] ${day.recommendation.isNadzar ? 'text-amber-500' : 'text-emerald-500'}`} />}
                                                {effectiveType === 'Ramadhan' && <MoonStar className="w-[60%] h-[60%] text-emerald-500" />}
                                                {['Ayyamul Bidh', 'Lainnya'].includes(effectiveType || '') && <Moon className="w-[60%] h-[60%] text-sky-500" />}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};
