
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  History as HistoryIcon,
  LayoutDashboard,
  Bell,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  Loader2,
  ExternalLink,
  Info,
  Clock3,
  Cloud,
  CloudUpload,
  LogOut,
  User,
  Moon,
  Sun,
  Monitor,
  AlertCircle,
  Lock,
  CloudDownload
} from 'lucide-react';
import { PrayerLog, AppState, DailySchedule, PrayerName, UserProfile } from './types';
import { STORAGE_KEYS, PRAYER_ORDER, PRAYER_COLORS } from './constants';
import { fetchPrayerTimes, searchLocations } from './services/prayerService';
import { uploadToCloud, downloadFromCloud, shouldAutoSync } from './services/syncService';
import { getCurrentTimeStr, calculateDelay, isLate, formatDate, isTimePassed } from './utils/helpers';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/ui/Button';

const CACHE_KEY_SEARCH = 'al_rizq_search_cache';
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Placeholder Client ID - user should replace this in Google Cloud Console
// Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || "";

type ThemeMode = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const savedSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    const savedUser = localStorage.getItem('al_rizq_user');

    return {
      logs: savedLogs ? JSON.parse(savedLogs) : [],
      schedule: savedSchedule ? JSON.parse(savedSchedule) : null,
      location: null,
      isLoading: false,
      error: null,
      user: savedUser ? JSON.parse(savedUser) : null,
      isSyncing: false
    };
  });

  const [activeTab, setActiveTab] = useState<'tracker' | 'dashboard' | 'history'>('tracker');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeStr());

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('al_rizq_theme') as ThemeMode) || 'system';
  });

  const searchTimeoutRef = useRef<number | null>(null);
  const googleBtnSidebarRef = useRef<HTMLDivElement>(null);
  const googleBtnHeaderRef = useRef<HTMLDivElement>(null);

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getCurrentTimeStr()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Theme Sync
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = themeMode === 'dark' || (themeMode === 'system' && mediaQuery.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
    localStorage.setItem('al_rizq_theme', themeMode);
    const listener = () => { if (themeMode === 'system') applyTheme(); };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  const cycleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light');
  };

  // Fix: Added handleLogout to clear user session and storage
  const handleLogout = useCallback(() => {
    setState(prev => ({ ...prev, user: null }));
    localStorage.removeItem('al_rizq_user');
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
  }, []);

  // Google Login Init
  const initGoogle = useCallback(() => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false, // Ensure it asks which account to use
        context: 'signin',
        callback: (response: any) => {
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const userData: UserProfile = {
              name: payload.name,
              email: payload.email,
              picture: payload.picture
            };
            setState(prev => ({ ...prev, user: userData }));
            localStorage.setItem('al_rizq_user', JSON.stringify(userData));
          } catch (e) { console.error(e); }
        }
      });

      const renderBtn = (ref: React.RefObject<HTMLDivElement>) => {
        if (ref.current) {
          ref.current.innerHTML = '';
          (window as any).google.accounts.id.renderButton(ref.current, {
            type: 'icon',
            shape: 'circle',
            theme: 'filled_blue',
            size: 'large',
          });
        }
      };

      renderBtn(googleBtnSidebarRef);
      renderBtn(googleBtnHeaderRef);
    }
  }, []);

  useEffect(() => {
    if (!(window as any).google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true; script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else { initGoogle(); }
  }, [initGoogle]);

  // Re-init Google when logging out
  useEffect(() => {
    if (!state.user && (window as any).google?.accounts?.id) {
      initGoogle();
    }
  }, [state.user, initGoogle]);

  // Live Search Suggestions
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const results = await searchLocations(searchQuery);
        setSuggestions(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const getLocationAndSchedule = useCallback(async (manualAddress?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      if (manualAddress) {
        const schedule = await fetchPrayerTimes({ address: manualAddress });
        setState(prev => ({ ...prev, schedule, isLoading: false }));
        setIsSearching(false); setSearchQuery(''); setShowHistory(false); setSuggestions([]);
        addToHistory(manualAddress);
      } else {
        const options = { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 };
        const pos: any = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, options));
        const schedule = await fetchPrayerTimes({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setState(prev => ({ ...prev, location: { lat: pos.coords.latitude, lng: pos.coords.longitude }, schedule, isLoading: false }));
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Gagal mengambil jadwal sholat.';
      if (err.code === 1) errorMessage = 'Izin lokasi ditolak. Silakan cari lokasi secara manual melalui tombol di atas.';
      else if (err.code === 2) errorMessage = 'Lokasi tidak tersedia. Pastikan GPS aktif atau gunakan pencarian manual.';
      else if (err.code === 3) errorMessage = 'Waktu pengambilan lokasi habis. Silakan gunakan pencarian manual.';

      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      if (!manualAddress) setIsSearching(true);
    }
  }, []);

  const addToHistory = (address: string) => {
    setLocationHistory(prev => {
      const updated = [address, ...prev.filter(a => a !== address)].slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
    if (savedHistory) setLocationHistory(JSON.parse(savedHistory));

    // Refresh schedule if it's a new day
    if (state.schedule) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (state.schedule.date !== todayStr) {
        getLocationAndSchedule();
      }
    }
  }, [getLocationAndSchedule]);

  const handleUpload = useCallback(async () => {
    if (!state.user?.email) return;
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      const timestamp = await uploadToCloud(state.user.email, state.logs);
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, timestamp.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [state.user, state.logs]);

  const handleDownload = useCallback(async () => {
    if (!state.user?.email) return;
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      const result = await downloadFromCloud(state.user.email);
      if (result) {
        setState(prev => ({ ...prev, logs: result.logs }));
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(result.logs));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, result.last_updated.toString());
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [state.user]);

  // Manual sync only as requested

  useEffect(() => {
    if (state.logs.length > 0 || localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
    }
  }, [state.logs]);

  useEffect(() => { if (state.schedule) localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(state.schedule)); }, [state.schedule]);

  const logPrayer = (prayerName: PrayerName, scheduledTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    const actualTime = getCurrentTimeStr();
    const delay = calculateDelay(scheduledTime, actualTime);
    const newLog: PrayerLog = {
      id: crypto.randomUUID(),
      date: today,
      prayerName,
      scheduledTime,
      actualTime,
      status: isLate(scheduledTime, actualTime) ? 'Terlambat' : 'Tepat Waktu',
      delayMinutes: delay,
    };
    const now = Date.now();
    setState(prev => {
      const newLogs = [...prev.logs, newLog];
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, now.toString());
      return { ...prev, logs: newLogs };
    });
  };

  const handleResetData = useCallback(() => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data tracker? Tindakan ini tidak dapat dibatalkan.')) {
      setState(prev => ({ ...prev, logs: [] }));
      localStorage.removeItem(STORAGE_KEYS.LOGS);
    }
  }, []);

  return (
    <div className="min-h-screen pb-32 lg:pb-0 lg:pl-64 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center lg:top-0 lg:bottom-0 lg:left-0 lg:w-64 lg:flex-col lg:justify-start lg:py-8 lg:border-r lg:border-t-0 z-50">
        <div className="hidden lg:flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">A</div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Al-Rizq</h1>
        </div>

        <div className="flex lg:flex-col lg:w-full gap-1 w-full justify-around lg:justify-start">
          {['tracker', 'dashboard', 'history'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex flex-col lg:flex-row items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all ${activeTab === tab ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {tab === 'tracker' && <Clock className="w-5 h-5 lg:w-6 lg:h-6" />}
              {tab === 'dashboard' && <LayoutDashboard className="w-5 h-5 lg:w-6 lg:h-6" />}
              {tab === 'history' && <HistoryIcon className="w-5 h-5 lg:w-6 lg:h-6" />}
              <span className="text-[10px] lg:text-sm capitalize font-bold">{tab}</span>
            </button>
          ))}
        </div>

        <div className="hidden lg:block w-full px-2 mt-auto border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
          <button onClick={cycleTheme} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all group">
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tampilan</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 capitalize">{themeMode}</span>
            </div>
            {themeMode === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
            {themeMode === 'dark' && <Moon className="w-4 h-4 text-emerald-400" />}
            {themeMode === 'system' && <Monitor className="w-4 h-4 text-slate-400" />}
          </button>

          {state.user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <img src={state.user.picture} alt="Avatar" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{state.user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{state.user.email}</p>
                  <div className="flex items-center gap-1 mt-1 opacity-60">
                    <Cloud className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-slate-400">Terakhir Sinkron: {localStorage.getItem(STORAGE_KEYS.LAST_SYNC) ? new Date(parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SYNC)!)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Belum'}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:text-rose-600 rounded-xl text-xs font-medium transition-all">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
              <p className="text-[11px] font-black uppercase text-slate-400 text-center">Cloud Sync</p>
              <div ref={googleBtnSidebarRef} className="rounded-full shadow-md overflow-hidden transform hover:scale-110 active:scale-95 transition-all"></div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 p-4 lg:p-10 max-w-6xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex justify-between items-center md:block">
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {activeTab === 'tracker' ? 'Tracker Sholat' : activeTab === 'dashboard' ? 'Statistik' : 'Riwayat'}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] lg:text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                  <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-emerald-600" /> {formatDate(new Date().toISOString().split('T')[0])}
                </span>
              </div>
            </div>

            {/* Mobile-only User/Theme Controls */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={cycleTheme}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400"
              >
                {themeMode === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
                {themeMode === 'dark' && <Moon className="w-5 h-5 text-emerald-400" />}
                {themeMode === 'system' && <Monitor className="w-5 h-5 text-slate-400" />}
              </button>

              {state.user ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end hidden md:flex">
                    <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">{state.user.name}</p>
                    <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">Cloud Synced</span>
                  </div>
                  <img src={state.user.picture} alt="Avatar" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800" />
                  <button onClick={handleLogout} className="p-2.5 text-rose-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div ref={googleBtnHeaderRef} className="rounded-full overflow-hidden scale-90 origin-right"></div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 lg:gap-3 w-full md:w-auto">
            <div className="flex flex-row items-center gap-2 w-full md:w-auto">
              <button onClick={() => setIsSearching(!isSearching)} className="flex-1 md:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:border-emerald-500 transition-all overflow-hidden min-w-0">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex-1 md:max-w-[150px]">{state.schedule?.location || 'Cari lokasi...'}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isSearching ? 'rotate-90' : ''}`} />
              </button>
              <Button
                variant="ghost"
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shrink-0"
                onClick={() => getLocationAndSchedule()}
                isLoading={state.isLoading && !isSearching}
                title="Perbarui Jadwal Sholat"
              >
                <RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />
              </Button>

              {/* In Desktop, show these inline with the buttons above */}
              {state.user && (
                <div className="hidden md:flex items-center gap-2 lg:gap-3">
                  <Button
                    variant="ghost"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
                    onClick={handleUpload}
                    isLoading={state.isSyncing && !state.isLoading}
                    title="Upload Riwayat ke Cloud"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span className="hidden lg:inline text-xs font-bold">Upload</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
                    onClick={handleDownload}
                    isLoading={state.isSyncing && !state.isLoading}
                    title="Download Riwayat dari Cloud"
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span className="hidden lg:inline text-xs font-bold">Download</span>
                  </Button>
                </div>
              )}
            </div>

            {/* In Mobile, show these in a separate row below */}
            {state.user && (
              <div className="flex md:hidden gap-2 w-full justify-stretch">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-2 p-2.5"
                  onClick={handleUpload}
                  isLoading={state.isSyncing && !state.isLoading}
                >
                  <CloudUpload className="w-4 h-4" />
                  <span className="text-xs font-bold">Upload</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-2 p-2.5"
                  onClick={handleDownload}
                  isLoading={state.isSyncing && !state.isLoading}
                >
                  <CloudDownload className="w-4 h-4" />
                  <span className="text-xs font-bold">Download</span>
                </Button>
              </div>
            )}
          </div>
        </header>

        {isSearching && (
          <div className="mb-8 animate-in slide-in-from-top-4 p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
            <form onSubmit={(e) => { e.preventDefault(); getLocationAndSchedule(searchQuery); }} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Masukkan kecamatan..." className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />

                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[60] overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSearchQuery(s);
                          getLocationAndSchedule(s);
                        }}
                        className="w-full px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {isSearchingSuggestions && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>
              <Button type="submit" className="px-8 rounded-2xl" isLoading={state.isLoading}>Cari</Button>
            </form>
          </div>
        )}

        {/* Added Grounding Sources Section as required by Gemini API guidelines */}
        {state.schedule?.sources && (
          <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-left-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-600" /> Sumber Data Resmi (Grounding)
            </p>
            <div className="flex flex-wrap gap-2">
              {state.schedule.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  {source.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" /> <p className="text-sm font-bold">{state.error}</p>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in duration-500">
            {PRAYER_ORDER.map((name) => {
              const prayer = state.schedule?.prayers.find(p => p.name === name);
              const loggedToday = state.logs.find(l => l.date === new Date().toISOString().split('T')[0] && l.prayerName === name);
              const isPassed = prayer ? isTimePassed(prayer.time) : false;

              return (
                <div key={name} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col transition-all hover:shadow-xl dark:hover:shadow-emerald-950/20 hover:border-emerald-100 dark:hover:border-emerald-900 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${PRAYER_COLORS[name]}`}>{name}</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 font-arabic">{prayer?.time || '--:--'}</div>
                  </div>
                  <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
                    {loggedToday ? (
                      <div className="flex items-center justify-between text-emerald-600">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6" />
                          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pelaksanaan</p><p className="text-sm font-black text-slate-800 dark:text-slate-100">{loggedToday.actualTime}</p></div>
                        </div>
                        {loggedToday.status === 'Terlambat' && <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-black">+{loggedToday.delayMinutes}m</span>}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10"
                          disabled={!prayer || !isPassed}
                          onClick={() => prayer && logPrayer(name, prayer.time)}
                        >
                          {!isPassed ? <Lock className="w-4 h-4 mr-2 opacity-50" /> : null}
                          {isPassed ? "Tandai Sholat" : "Belum Waktunya"}
                        </Button>
                        {!isPassed && prayer && (
                          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Siap pada {prayer.time}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard logs={state.logs} />}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4 lg:px-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Log Pelaksanaan</h3>
              <button
                onClick={handleResetData}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/50 transition-all bg-white dark:bg-slate-900 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Reset Data
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    {['Tanggal', 'Sholat', 'Waktu', 'Status'].map(h => <th key={h} className="px-8 py-5 text-[11px] font-black uppercase text-slate-400">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...state.logs].reverse().map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">{log.date}</td>
                      <td className="px-8 py-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${PRAYER_COLORS[log.prayerName]}`}>{log.prayerName}</span></td>
                      <td className="px-8 py-5 text-sm font-black text-slate-800 dark:text-slate-100">{log.actualTime} <span className="opacity-40 text-xs ml-2">({log.scheduledTime})</span></td>
                      <td className="px-8 py-5"><span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${log.status === 'Ontime' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{log.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
