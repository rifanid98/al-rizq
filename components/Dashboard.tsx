
import React, { useMemo } from 'react';
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
import { PrayerLog } from '../types';
import { CheckCircle2, Clock, MapPin, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  logs: PrayerLog[];
}

export const Dashboard: React.FC<DashboardProps> = ({ logs }) => {
  const isDark = document.documentElement.classList.contains('dark');

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

    return { total, ontime, late, missed, avgDelay, atMosque, atHome, masbuqCount, totalMasbuqRakaat };
  }, [logs]);

  const pieData = [
    { name: 'Tepat Waktu', value: stats.ontime, color: '#10b981' },
    { name: 'Terlambat', value: stats.late, color: '#f59e0b' },
    { name: 'Terlewat', value: stats.missed, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const locationData = [
    { name: 'Masjid', value: stats.atMosque, color: '#0ea5e9' },
    { name: 'Rumah', value: stats.atHome, color: '#6366f1' },
  ].filter(d => d.value > 0);

  const chartData = useMemo(() => {
    const days = [...new Set(logs.map(l => l.date))].sort().slice(-7);
    return days.map(date => ({
      name: new Date(date as string).toLocaleDateString('id-ID', { weekday: 'short' }),
      ontime: logs.filter(l => l.date === date && (l.status === 'Tepat Waktu' || l.status === 'Ontime')).length,
      late: logs.filter(l => l.date === date && (l.status === 'Terlambat' || l.status === 'Late')).length,
    }));
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-700" />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Belum Ada Data</h3>
        <p className="text-slate-500 dark:text-slate-500 mt-2 font-medium">Mulai catat sholatmu untuk melihat laporan di sini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-emerald-500/30 transition-all">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Tepat Waktu</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.ontime}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-amber-500/30 transition-all">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Terlambat</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.late}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-blue-500/30 transition-all">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Di Masjid</p>
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.atMosque}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm group hover:border-rose-500/30 transition-all">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Masbuq</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.masbuqCount}</p>
              <span className="text-[10px] font-bold text-slate-400">({stats.totalMasbuqRakaat} rak)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Adherence Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-10">Konsistensi Mingguan</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: isDark ? '#64748b' : '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: isDark ? '#64748b' : '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: isDark ? '#0f172a' : '#f8fafc' }}
                  contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 700 }}
                />
                <Bar dataKey="ontime" name="Tepat Waktu" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="late" name="Terlambat" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-1">
          {/* Status Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest text-center">Status</h3>
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
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-widest text-center">Lokasi</h3>
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

      {/* Detail Masbuq Summary */}
      <div className="bg-emerald-600 dark:bg-emerald-900/40 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">Performa Ibadah</h3>
            <p className="text-emerald-100 font-medium opacity-80">Teruskan konsistensi untuk hasil yang maksimal.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
          <div className="text-center md:text-left">
            <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">Masjid Rate</p>
            <p className="text-2xl font-black">{stats.total > 0 ? Math.round((stats.atMosque / stats.total) * 100) : 0}%</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">Ontime Rate</p>
            <p className="text-2xl font-black">{stats.total > 0 ? Math.round((stats.ontime / stats.total) * 100) : 0}%</p>
          </div>
          <div className="text-center md:text-left col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">Avg Delay</p>
            <p className="text-2xl font-black">{stats.avgDelay}m</p>
          </div>
        </div>
      </div>
    </div>
  );
};
