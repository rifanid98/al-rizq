import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { PrayerLog, FastingLog, DzikirLog } from '../../../shared/types';
import { CheckCircle2, Clock, MapPin, AlertCircle, TrendingUp, ChevronDown, SunMedium, Moon, Info, User, Star, Utensils } from 'lucide-react';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { FastingStats } from '../../fasting/components/FastingStats';

import { GamificationConfig } from '../../../shared/types';

interface DashboardProps {
  logs: PrayerLog[];
  fastingLogs: FastingLog[];
  dzikirLogs: DzikirLog[];
  hijriDate?: any; // To be passed from App.tsx
  gamification: {
    level: number;
    progress: number;
    totalPoints: number;
    nextLevelXp: number;
    currentLevelXp: number;
    config: GamificationConfig;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, fastingLogs, dzikirLogs, hijriDate, gamification }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const performanceRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isSunnahStatsExpanded, setIsSunnahStatsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'prayer' | 'fasting' | 'dzikir'>(() => {
    if (logs.length === 0 && fastingLogs.length > 0) return 'fasting';
    return 'prayer';
  });
  const { t, language } = useLanguage();

  useEffect(() => {
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

    const timer = setTimeout(handleScroll, 200);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timer);
    };
  }, [logs]);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const stats = useMemo(() => {
    const total = logs.length;
    const ontime = logs.filter(l => l.status === 'Tepat Waktu' || l.status === 'Ontime').length;
    const late = logs.filter(l => l.status === 'Terlambat' || l.status === 'Late').length;
    const missed = logs.filter(l => l.status === 'Terlewat' || l.status === 'Missed').length;

    const atMosque = logs.filter(l => l.locationType === 'Masjid').length;
    const atHome = logs.filter(l => l.locationType === 'Rumah').length;
    const masbuqCount = logs.filter(l => l.isMasbuq).length;
    const totalMasbuqRakaat = logs.reduce((acc, curr) => acc + (curr.masbuqRakaat || 0), 0);

    const avgDelay = late > 0
      ? Math.round(logs.filter(l => l.status === 'Terlambat' || l.status === 'Late').reduce((acc, curr) => acc + curr.delayMinutes, 0) / late)
      : 0;

    const dzikirCount = logs.filter(l => l.hasDzikir).length;
    const qobliyahCount = logs.filter(l => l.hasQobliyah).length;
    const badiyahCount = logs.filter(l => l.hasBadiyah).length;
    const duaCount = logs.filter(l => l.hasDua).length;
    const totalWorship = dzikirCount + qobliyahCount + badiyahCount + duaCount;

    return {
      total, ontime, late, missed, avgDelay, atMosque, atHome, masbuqCount, totalMasbuqRakaat,
      dzikirCount, qobliyahCount, badiyahCount, duaCount, totalWorship
    };
  }, [logs]);

  const pieData = [
    { name: t.dashboard.status.ontime, value: stats.ontime, color: '#10b981' },
    { name: t.dashboard.status.late, value: stats.late, color: '#f59e0b' },
    { name: t.dashboard.status.missed, value: stats.missed, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const locationData = [
    { name: t.tracker.execution.atMosque, value: stats.atMosque, color: '#0ea5e9' },
    { name: t.tracker.execution.atHome, value: stats.atHome, color: '#6366f1' },
  ].filter(d => d.value > 0);

  const chartData = useMemo(() => {
    const days = [...new Set(logs.map(l => l.date))].sort().slice(-7);
    return days.map(date => {
      const dayLogs = logs.filter(l => l.date === date);
      return {
        name: new Date(date as string).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
        ontime: dayLogs.filter(l => l.status === 'Tepat Waktu' || l.status === 'Ontime').length,
        late: dayLogs.filter(l => l.status === 'Terlambat' || l.status === 'Late').length,
        sunnah: dayLogs.filter(l => l.hasQobliyah).length + dayLogs.filter(l => l.hasBadiyah).length + dayLogs.filter(l => l.hasDzikir).length + dayLogs.filter(l => l.hasDua).length,
      };
    });
  }, [logs]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">



      {/* Sub-Tabs for Dashboard */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto">
        <button
          onClick={() => setActiveTab('prayer')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'prayer' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          {t.common.prayer}
        </button>
        <button
          onClick={() => setActiveTab('fasting')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'fasting' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          {t.fasting.statsTitle}
        </button>
        <button
          onClick={() => setActiveTab('dzikir')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dzikir' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          {t.tabs.dzikir}
        </button>
      </div>

      {
        (logs.length === 0 && fastingLogs.length === 0 && activeTab !== 'dzikir') ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{t.dashboard.noData}</h3>
            <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">{t.dashboard.noDataSubtitle}</p>
          </div>
        ) : (
          <>

            {/* Floating Scroll CTA (Visible based on scroll) */}
            <button
              onClick={scrollToBottom}
              title={t.dashboard.scrollToBottom || "Scroll to Bottom"}
              className={`fixed right-6 lg:right-10 z-[60] flex items-center justify-center w-14 h-14 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 animate-in slide-in-from-bottom-8 duration-500 hover:scale-110 active:scale-95 transition-all group ${showScrollBtn ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-12 pointer-events-none'
                } ${
                // Tablet/Mobile: Above bottom nav
                // Desktop: Bottom-10
                'bottom-28 lg:bottom-10'
                }`}
            >
              <ChevronDown className="w-8 h-8 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Content Area */}
            <div className="flex flex-col gap-8">
              {activeTab === 'fasting' ? (
                <FastingStats hijriDate={hijriDate} fastingLogs={fastingLogs} />
              ) : activeTab === 'dzikir' ? (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Dzikir Stats Summary */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
                        <Star className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{t.tabs.dzikir}</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.dashboard.dzikirStats}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {/* Total Session */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.dashboard.totalSessions}</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{dzikirLogs.filter(l => l.isCompleted).length}</p>
                      </div>
                      {/* Pagi vs Petang */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl flex flex-col justify-center gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500"><SunMedium className="w-3 h-3 inline mr-1" /> {t.dashboard.morning}</span>
                          <span className="font-black">{dzikirLogs.filter(l => l.categoryId === 'pagi' && l.isCompleted).length}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${(dzikirLogs.filter(l => l.categoryId === 'pagi' && l.isCompleted).length / (dzikirLogs.filter(l => l.isCompleted).length || 1)) * 100}%` }} />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs font-bold text-slate-500"><Moon className="w-3 h-3 inline mr-1" /> {t.dashboard.evening}</span>
                          <span className="font-black">{dzikirLogs.filter(l => l.categoryId === 'petang' && l.isCompleted).length}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${(dzikirLogs.filter(l => l.categoryId === 'petang' && l.isCompleted).length / (dzikirLogs.filter(l => l.isCompleted).length || 1)) * 100}%` }} />
                        </div>
                      </div>
                      {/* Streak (Simple Calculation) */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.dashboard.currentStreak}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {(() => {
                              let streak = 0;
                              const uniqueDates = [...new Set(dzikirLogs.filter(l => l.isCompleted).map(l => l.date))].sort().reverse();
                              const today = new Date().toISOString().split('T')[0];
                              // If today is not in list but yesterday is, streak might still be valid depending on logic, but for simple 'current streak':
                              // We count consecutive dates backwards from today or yesterday.

                              // Simple logic:
                              let expectedDate = new Date();

                              // Check if today exists, if not check yesterday. If neither, streak is 0.
                              const hasToday = uniqueDates.includes(today);
                              const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                              const hasYesterday = uniqueDates.includes(yesterday.toISOString().split('T')[0]);

                              if (!hasToday && !hasYesterday) return 0;

                              // Start counting
                              let current = new Date();
                              // If no log today, start check from yesterday
                              if (!hasToday) current.setDate(current.getDate() - 1);

                              while (true) {
                                const dateStr = current.toISOString().split('T')[0];
                                if (uniqueDates.includes(dateStr)) {
                                  streak++;
                                  current.setDate(current.getDate() - 1);
                                } else {
                                  break;
                                }
                              }
                              return streak;
                            })()}
                          </p>
                          <span className="text-xs font-bold text-slate-400">{t.dashboard.days}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-8">


                  {/* Detail Masbuq Summary (Performa Ibadah) */}
                  <div
                    ref={performanceRef}
                    className="order-last md:order-first bg-emerald-600 dark:bg-emerald-900/40 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-8 text-white"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">{t.dashboard.performance}</h3>
                        <p className="text-emerald-100 font-medium opacity-80">{t.dashboard.performanceSubtitle}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full lg:w-auto">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{t.dashboard.masjidRate}</p>
                        <p className="text-2xl font-black">{stats.total > 0 ? Math.round((stats.atMosque / stats.total) * 100) : 0}%</p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{t.dashboard.ontimeRate}</p>
                        <p className="text-2xl font-black">{stats.total > 0 ? Math.round((stats.ontime / stats.total) * 100) : 0}%</p>
                      </div>
                      <div className="text-center md:text-left col-span-2 md:col-span-1">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">{t.dashboard.avgDelay}</p>
                        <p className="text-2xl font-black">{stats.avgDelay}m</p>
                      </div>
                    </div>
                  </div>

                  {/* Primary Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-emerald-500/30 transition-all">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.tracker.status.ontime}</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.ontime}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-amber-500/30 transition-all">
                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.tracker.status.late}</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.late}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-blue-500/30 transition-all">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.tracker.execution.atMosque}</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.atMosque}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-rose-500/30 transition-all">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.dashboard.masbuq}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.masbuqCount}</p>
                          <span className="text-[10px] font-bold text-slate-400">({stats.totalMasbuqRakaat} rak)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sunnah & Supplemental Worship Accordion/Grid */}
                  <div className="flex flex-col gap-4">
                    {/* Mobile Header Toggle */}
                    <button
                      onClick={() => setIsSunnahStatsExpanded(!isSunnahStatsExpanded)}
                      className="lg:hidden w-full flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                        <Star className="w-5 h-5 fill-current opacity-20" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{t.dashboard.sunnahStats}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isSunnahStatsExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Desktop Header Label (Optional, matches mobile style but no button) */}
                    <div className="hidden lg:block">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{t.dashboard.sunnahStats}</p>
                    </div>

                    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 transition-all duration-300 ${!isSunnahStatsExpanded ? 'hidden lg:grid' : 'grid'}`}>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-emerald-500/30 transition-all">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <SunMedium className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.tracker.qobliyah}</p>
                          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.qobliyahCount}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-emerald-500/30 transition-all">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <Moon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.tracker.badiyah}</p>
                          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.badiyahCount}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-emerald-500/30 transition-all">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <Star className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.tracker.dzikir}</p>
                          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.dzikirCount}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-emerald-500/30 transition-all">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t.dashboard.dua}</p>
                          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.duaCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Adherence Chart */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-10">{t.dashboard.weeklyConsistency}</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={6} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: isDark ? '#64748b' : '#94a3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: isDark ? '#64748b' : '#94a3b8' }} />
                            <Tooltip
                              cursor={{ fill: isDark ? '#0f172a' : '#f8fafc' }}
                              contentStyle={{
                                backgroundColor: isDark ? '#0f172a' : '#fff',
                                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                borderRadius: '16px',
                                fontWeight: 700,
                                fontSize: '11px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                              }}
                              itemStyle={{ padding: '2px 0' }}
                            />
                            <Bar dataKey="ontime" name={t.tracker.status.ontime} fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="late" name={t.tracker.status.late} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="sunnah" name={t.dashboard.sunnahStats} fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={12} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Breakdown Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-1">
                      {/* Status Breakdown */}
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest text-center">{t.common.statusLabel}</h3>
                        <div className="h-48 relative flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{stats.total}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest">
                          {pieData.map(item => (
                            <div key={item.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-500">{item.name}</span>
                              </div>
                              <span className="text-slate-800 dark:text-slate-100">{Math.round((item.value / stats.total) * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Location Breakdown */}
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest text-center">{t.common.location}</h3>
                        <div className="h-48 relative flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={locationData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                                {locationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <MapPin className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest">
                          {locationData.map(item => (
                            <div key={item.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-500">{item.name}</span>
                              </div>
                              <span className="text-slate-800 dark:text-slate-100">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </>
        )
      }

      {/* Sentinel for bottom detection */}
      <div ref={bottomRef} className="h-1" />
    </div >
  );
};
