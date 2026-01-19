
import React, { useMemo, useState, useEffect } from 'react';
import { useLanguage } from "../../../shared/hooks/useLanguage";
import { useFastingLogs } from "../hooks/useFastingLogs";
import { getMonthForecast } from "../services/fastingService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar as CalendarIcon, Info, Star, RotateCcw, Moon, Target, TrendingUp } from 'lucide-react';
import { HijriDate, FastingType } from '../../../shared/types';
import { getLocalDateStr } from '../../../shared/utils/helpers';

interface NadzarConfig {
    types: FastingType[];
    days: number[];
    customDates: string[];
}

const STORAGE_KEY_NADZAR_CONFIG = 'al_rizq_nadzar_config';
const STORAGE_KEY_QADHA_CONFIG = 'al_rizq_qadha_config';

interface FastingStatsProps {
    hijriDate?: HijriDate;
}

export const FastingStats: React.FC<FastingStatsProps> = ({ hijriDate }) => {
    const { t } = useLanguage();
    const { getLogStats, fastingLogs } = useFastingLogs();
    const stats = getLogStats();

    // Nadzar Config State
    const [nadzarConfig, setNadzarConfig] = useState<NadzarConfig>({ types: [], days: [], customDates: [] });

    // Qadha Config State
    const [qadhaConfig, setQadhaConfig] = useState<NadzarConfig>({ types: [], days: [], customDates: [] });

    useEffect(() => {
        const loadConfig = () => {
            const savedNadzar = localStorage.getItem(STORAGE_KEY_NADZAR_CONFIG);
            if (savedNadzar) setNadzarConfig(JSON.parse(savedNadzar));

            const savedQadha = localStorage.getItem(STORAGE_KEY_QADHA_CONFIG);
            if (savedQadha) setQadhaConfig(JSON.parse(savedQadha));
        };

        loadConfig();

        window.addEventListener('nadzar_config_updated', loadConfig);
        window.addEventListener('qadha_config_updated', loadConfig);
        return () => {
            window.removeEventListener('nadzar_config_updated', loadConfig);
            window.removeEventListener('qadha_config_updated', loadConfig);
        };
    }, []);

    const checkIsNadzar = (date: string) => {
        const dateObj = new Date(date + 'T00:00:00');
        const day = dateObj.getDay();
        if (nadzarConfig.days.includes(day)) return true;
        if (nadzarConfig.customDates.includes(date)) return true;
        return false;
    };

    const checkIsQadha = (date: string) => {
        const dateObj = new Date(date + 'T00:00:00');
        const day = dateObj.getDay();
        if (qadhaConfig.days.includes(day)) return true;
        if (qadhaConfig.customDates.includes(date)) return true;
        return false;
    };

    // Data for Charts
    const data = [
        { name: 'Sunnah', value: stats.sunnah, color: '#10B981' }, // Emerald 500
        { name: 'Nadzar', value: stats.nadzar, color: '#F59E0B' }, // Amber 500
        { name: 'Qadha', value: stats.qadha, color: '#F43F5E' }, // Rose 500
    ].filter(d => d.value > 0);

    // Monthly Forecast Calendar
    const currentMonthForecast = useMemo(() => {
        const now = new Date();
        return getMonthForecast(now.getFullYear(), now.getMonth());
    }, []);

    // Helper to check if a date is fasted and get type
    const getFastedLog = (date: string) => fastingLogs.find(l => l.date === date);

    return (
        <div className="flex flex-col gap-6">
            {/* Fasting Performance Panel */}
            <div className="order-last md:order-first bg-emerald-600 dark:bg-emerald-900/40 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
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
                        <p className="text-2xl font-black">{stats.streak} <span className="text-sm font-bold opacity-60">Hari</span></p>
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{t.fasting.stats.total}</p>
                        <p className="text-2xl font-black">{stats.total} <span className="text-sm font-bold opacity-60">Hari</span></p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
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



            {/* Distribution Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800">
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

            {/* Monthly Forecast Calendar */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-emerald-500" />
                        {t.fasting.history}
                    </h4>
                    <span className="text-xs font-bold text-slate-400">{new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</span>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d, i) => (
                        <div key={i} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for start of month padding - simplified for MVP, ideally calculate offset */}
                    {Array.from({ length: new Date(currentMonthForecast[0].date).getDay() === 0 ? 6 : new Date(currentMonthForecast[0].date).getDay() - 1 }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {currentMonthForecast.map((day) => {
                        const log = getFastedLog(day.date);
                        const isDayFasted = !!log;
                        const originalType = day.recommendation.type;
                        const isNadzarConfigured = checkIsNadzar(day.date);
                        const isQadhaConfigured = checkIsQadha(day.date);

                        // Priority Logic: Leave Sunnah as is, otherwise valid Nadzar becomes Nadzar, otherwise Qadha
                        const effectiveType = (originalType === 'Senin-Kamis' || originalType === 'Ayyamul Bidh' || originalType === 'Ramadhan')
                            ? originalType
                            : (isNadzarConfigured ? 'Nadzar' : (isQadhaConfigured ? 'Qadha' : originalType));

                        const isRecommended = !!effectiveType;
                        const isToday = day.date === getLocalDateStr();

                        return (
                            <div key={day.date} className="aspect-square relative flex items-center justify-center p-1">
                                <div className={`w-full h-full rounded-2xl flex items-center justify-center text-[10px] font-bold transition-all relative overflow-hidden
                                    ${!isDayFasted && !isRecommended
                                        ? 'text-slate-600 dark:text-slate-400'
                                        : (isDayFasted || (isRecommended && !day.recommendation.isForbidden))
                                            ? (
                                                (log?.type === 'Nadzar' || effectiveType === 'Nadzar') ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200' :
                                                    (log?.type === 'Qadha' || effectiveType === 'Qadha') ? 'bg-rose-500 dark:bg-rose-600 text-white shadow-md shadow-rose-500/20' :
                                                        (log?.type === 'Senin-Kamis' || effectiveType === 'Senin-Kamis') ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200' :
                                                            ['Ayyamul Bidh', 'Ramadhan', 'Lainnya'].includes(log?.type || effectiveType || '') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200' :
                                                                'bg-slate-100 dark:bg-slate-800'
                                            )
                                            : ''
                                    }
                                    ${isToday && !isDayFasted && !isRecommended ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700' : ''}
                                `}>
                                    {(!isDayFasted && (!isRecommended || day.recommendation.isForbidden)) && (
                                        <span className="relative z-0 text-lg font-black">{new Date(day.date).getDate()}</span>
                                    )}

                                    {isDayFasted ? (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                            {log?.type === 'Nadzar' && <Target className="w-[60%] h-[60%]" />}
                                            {log?.type === 'Qadha' && <RotateCcw className="w-[60%] h-[60%] text-white" />}
                                            {log?.type === 'Senin-Kamis' && <Star className="w-[60%] h-[60%]" />}
                                            {['Ayyamul Bidh', 'Ramadhan', 'Lainnya'].includes(log?.type || '') && <Moon className="w-[60%] h-[60%]" />}
                                        </div>
                                    ) : (
                                        isRecommended && !day.recommendation.isForbidden && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-50">
                                                {effectiveType === 'Nadzar' && <Target className="w-[60%] h-[60%] text-amber-500" />}
                                                {effectiveType === 'Qadha' && <RotateCcw className="w-[60%] h-[60%] text-white" />}
                                                {effectiveType === 'Senin-Kamis' && <Star className="w-[60%] h-[60%] text-emerald-500" />}
                                                {['Ayyamul Bidh', 'Ramadhan', 'Lainnya'].includes(effectiveType || '') && <Moon className="w-[60%] h-[60%] text-sky-500" />}
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
