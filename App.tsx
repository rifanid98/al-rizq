
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
  CloudDownload,
  ChevronLeft,
  CalendarDays,
  RotateCcw
} from 'lucide-react';
import { PrayerLog, AppState, DailySchedule, PrayerName, UserProfile } from './types';
import { STORAGE_KEYS, PRAYER_ORDER, PRAYER_COLORS, PRAYER_RAKAAT, PRAYER_IMAGES } from './constants';
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

  const [activeTab, setActiveTab] = useState<'tracker' | 'dashboard' | 'history'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) as any) || 'tracker';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeStr());
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  // Late prayer reason modal state
  const [lateModalOpen, setLateModalOpen] = useState(false);
  const [pendingLatePrayer, setPendingLatePrayer] = useState<{ name: PrayerName; scheduledTime: string } | null>(null);
  const [lateReason, setLateReason] = useState('');
  const [isMasbuq, setIsMasbuq] = useState(false);
  const [masbuqRakaat, setMasbuqRakaat] = useState(1);
  const [locationType, setLocationType] = useState<'Rumah' | 'Masjid'>('Masjid');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [isForgotMarking, setIsForgotMarking] = useState(false);
  const [hasBackup, setHasBackup] = useState(!!localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP));

  const [showPrayerBg, setShowPrayerBg] = useState<boolean>(() => {
    const saved = localStorage.getItem('al_rizq_show_bg');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [prayerBgOpacity, setPrayerBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('al_rizq_bg_opacity');
    return saved !== null ? JSON.parse(saved) : 10;
  });
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const sliderTimerRef = useRef<number | null>(null);

  const resetSliderTimer = useCallback(() => {
    if (sliderTimerRef.current) window.clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = window.setTimeout(() => {
      setShowOpacitySlider(false);
    }, 5000);
  }, []);

  // History date filter - empty string means show all
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('al_rizq_theme') as ThemeMode) || 'system';
  });

  const searchTimeoutRef = useRef<number | null>(null);
  const googleBtnSidebarRef = useRef<HTMLDivElement>(null);
  const googleBtnHeaderRef = useRef<HTMLDivElement>(null);
  const lastDateRef = useRef(currentDate);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('al_rizq_show_bg', JSON.stringify(showPrayerBg));
  }, [showPrayerBg]);

  useEffect(() => {
    localStorage.setItem('al_rizq_bg_opacity', JSON.stringify(prayerBgOpacity));
  }, [prayerBgOpacity]);

  // Update clock every minute and check for date change
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeStr());
      const today = new Date().toISOString().split('T')[0];
      if (today !== lastDateRef.current) {
        lastDateRef.current = today;
        setCurrentDate(today);
      }
    }, 30000);
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

  // Refresh schedule when date changes (detected by timer)
  useEffect(() => {
    if (state.schedule && state.schedule.date !== currentDate) {
      getLocationAndSchedule();
    }
  }, [currentDate, getLocationAndSchedule, state.schedule]);

  const handleUpload = useCallback(async () => {
    if (!state.user?.email) return;
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      // Backup current cloud data before overwriting
      const result = await downloadFromCloud(state.user.email);
      if (result && result.logs && result.logs.length > 0) {
        localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(result.logs));
        setHasBackup(true);
      }

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
        // Backup current logs before overwriting
        localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(state.logs));
        setHasBackup(true);

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
  }, [state.user, state.logs]);

  const handleRevert = useCallback(() => {
    const backup = localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP);
    if (backup && window.confirm('Apakah Anda yakin ingin membatalkan sinkronisasi terakhir dan kembali ke data sebelumnya?')) {
      const restoredLogs = JSON.parse(backup);
      setState(prev => ({ ...prev, logs: restoredLogs }));
      localStorage.setItem(STORAGE_KEYS.LOGS, backup);
      localStorage.removeItem(STORAGE_KEYS.LOGS_BACKUP);
      setHasBackup(false);
    }
  }, []);

  // Manual sync only as requested

  useEffect(() => {
    if (state.logs.length > 0 || localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
    }
  }, [state.logs]);

  useEffect(() => { if (state.schedule) localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(state.schedule)); }, [state.schedule]);

  const handlePrayerClick = (prayerName: PrayerName, scheduledTime: string) => {
    const actualTime = getCurrentTimeStr();
    const late = isLate(scheduledTime, actualTime);

    if (late) {
      // Show modal for late reason
      setPendingLatePrayer({ name: prayerName, scheduledTime });
      setLateReason('');
      setIsMasbuq(false);
      setMasbuqRakaat(1);
      setLocationType('Masjid');
      setEditingLogId(null);
      setIsLateEntry(true);
      setIsForgotMarking(false);
      setLateModalOpen(true);
    } else {
      // Log immediately if on time
      logPrayer(prayerName, scheduledTime);
      // But open the detail modal anyway to allow adding optional info
      setPendingLatePrayer({ name: prayerName, scheduledTime });
      setLateReason('');
      setIsMasbuq(false);
      setMasbuqRakaat(1);
      setLocationType('Masjid');
      setEditingLogId(null);
      setIsLateEntry(false);
      setIsForgotMarking(false);
      setLateModalOpen(true);
    }
  };

  const handleEditPrayer = (log: PrayerLog) => {
    setPendingLatePrayer({ name: log.prayerName, scheduledTime: log.scheduledTime });
    setLateReason(log.reason?.replace('(Lupa menandai) ', '') || '');
    setIsMasbuq(log.isMasbuq || false);
    setMasbuqRakaat(log.masbuqRakaat || 1);
    setLocationType(log.locationType || 'Masjid');
    setEditingLogId(log.id);
    setIsLateEntry(log.status === 'Terlambat');
    setIsForgotMarking(log.reason?.includes('(Lupa menandai)') || false);
    setLateModalOpen(true);
  };

  const logPrayer = (prayerName: PrayerName, scheduledTime: string, reason?: string, isForgot: boolean = false, extra?: Partial<PrayerLog>) => {
    const today = new Date().toISOString().split('T')[0];
    const actualTime = getCurrentTimeStr();
    const delay = calculateDelay(scheduledTime, actualTime);

    let status: PrayerLog['status'] = 'Tepat Waktu';
    if (!isForgot && isLate(scheduledTime, actualTime)) {
      status = 'Terlambat';
    }

    const now = Date.now();
    setState(prev => {
      // Find if we are updating an existing entry by ID or by daily name
      const targetId = extra?.id || editingLogId;
      const updateIdx = targetId ? prev.logs.findIndex(l => l.id === targetId) : -1;
      const existingDailyIdx = prev.logs.findIndex(l => l.date === today && l.prayerName === prayerName && !targetId);

      const targetIdx = updateIdx !== -1 ? updateIdx : existingDailyIdx;
      const existingLog = targetIdx !== -1 ? prev.logs[targetIdx] : null;

      const logData: PrayerLog = {
        id: (targetId || crypto.randomUUID()),
        date: existingLog ? existingLog.date : today,
        prayerName,
        scheduledTime,
        actualTime: existingLog ? existingLog.actualTime : (extra?.actualTime || actualTime),
        status: existingLog ? existingLog.status : status,
        delayMinutes: existingLog ? existingLog.delayMinutes : delay,
        reason: isForgot ? (reason ? `(Lupa menandai) ${reason}` : 'Lupa menandai') : (reason || undefined),
        isMasbuq: isMasbuq,
        masbuqRakaat: isMasbuq ? masbuqRakaat : undefined,
        locationType: locationType,
        ...extra
      };

      let newLogs = [...prev.logs];
      if (targetIdx !== -1) {
        newLogs[targetIdx] = logData;
      } else {
        newLogs.push(logData);
      }

      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, now.toString());
      return { ...prev, logs: newLogs };
    });
  };

  const confirmLatePrayer = () => {
    if (pendingLatePrayer) {
      logPrayer(pendingLatePrayer.name, pendingLatePrayer.scheduledTime, lateReason.trim() || undefined, isForgotMarking);
      setLateModalOpen(false);
      setPendingLatePrayer(null);
      setLateReason('');
      setIsMasbuq(false);
      setMasbuqRakaat(1);
      setLocationType('Masjid');
      setEditingLogId(null);
      setIsLateEntry(false);
      setIsForgotMarking(false);
    }
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

          {/* Compact Background Image Controls (Desktop) */}
          <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Latar Gambar</span>
              <button
                onClick={() => setShowPrayerBg(!showPrayerBg)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${showPrayerBg ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showPrayerBg ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            {showPrayerBg && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={prayerBgOpacity}
                  onChange={(e) => setPrayerBgOpacity(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 w-6 text-right">{prayerBgOpacity}%</span>
              </div>
            )}
          </div>

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
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
          <div className="flex justify-between items-start w-full">
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

            {/* Top-Right Controls for Mobile & Tablet (lg:hidden) */}
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <button
                onClick={cycleTheme}
                className="p-2 lg:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400"
              >
                {themeMode === 'light' && <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />}
                {themeMode === 'dark' && <Moon className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />}
                {themeMode === 'system' && <Monitor className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />}
              </button>

              {/* Compact Background Image Controls */}
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative">
                <button
                  onClick={() => {
                    if (!showPrayerBg) {
                      setShowPrayerBg(true);
                      setShowOpacitySlider(true);
                      resetSliderTimer();
                    } else {
                      // If it's on, turn it off and hide the slider
                      setShowPrayerBg(false);
                      setShowOpacitySlider(false);
                      if (sliderTimerRef.current) window.clearTimeout(sliderTimerRef.current);
                    }
                  }}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${showPrayerBg ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${showPrayerBg ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
                {showPrayerBg && showOpacitySlider && (
                  <div
                    className="absolute top-full right-0 mt-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 min-w-[200px] animate-in slide-in-from-top-2 duration-300"
                    onMouseEnter={() => { if (sliderTimerRef.current) window.clearTimeout(sliderTimerRef.current); }}
                    onMouseLeave={resetSliderTimer}
                  >
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opacity</span>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{prayerBgOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="5"
                        value={prayerBgOpacity}
                        onChange={(e) => {
                          setPrayerBgOpacity(parseInt(e.target.value));
                          resetSliderTimer();
                        }}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    <button
                      onClick={() => setShowOpacitySlider(false)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {state.user ? (
                <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <img src={state.user.picture} alt="Avatar" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg border border-white dark:border-slate-800" />
                  <div className="hidden sm:flex flex-col pr-1">
                    <p className="text-[9px] font-black text-slate-800 dark:text-slate-100 truncate max-w-[80px]">{state.user.name}</p>
                    <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">Synced</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div ref={googleBtnHeaderRef} className="rounded-full overflow-hidden scale-75 origin-right"></div>
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
                    <span className="hidden md:inline text-xs font-bold">Upload</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
                    onClick={handleDownload}
                    isLoading={state.isSyncing && !state.isLoading}
                    title="Download Riwayat dari Cloud"
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span className="hidden md:inline text-xs font-bold">Download</span>
                  </Button>
                  {hasBackup && (
                    <Button
                      variant="ghost"
                      className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                      onClick={handleRevert}
                      title="Batalkan Sinkronisasi & Kembali ke Data Sebelumnya"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden md:inline text-xs font-bold">Revert</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Combined User/Sync/Revert Row for combined view (Mobile/Small Tablet) */}
            {activeTab !== 'history' && (
              <div className="flex md:hidden flex-col gap-3 w-full">

                {/* Cloud Sync/Revert Row */}
                {state.user && (
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="ghost"
                      className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-2 p-2"
                      onClick={handleUpload}
                      isLoading={state.isSyncing && !state.isLoading}
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Upload</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-2 p-2"
                      onClick={handleDownload}
                      isLoading={state.isSyncing && !state.isLoading}
                    >
                      <CloudDownload className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Download</span>
                    </Button>
                    {hasBackup && (
                      <Button
                        variant="ghost"
                        className="flex-1 h-10 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-center gap-2 p-2 text-rose-600 dark:text-rose-400"
                        onClick={handleRevert}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Revert</span>
                      </Button>
                    )}
                  </div>
                )}
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
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {PRAYER_ORDER.map((name) => {
                const prayer = state.schedule?.prayers.find(p => p.name === name);
                const loggedToday = state.logs.find(l => l.date === new Date().toISOString().split('T')[0] && l.prayerName === name);
                const isPassed = prayer ? isTimePassed(prayer.time) : false;

                return (
                  <div key={name} className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col transition-all hover:shadow-2xl dark:hover:shadow-emerald-950/20 hover:border-emerald-100 dark:hover:border-emerald-900 group">
                    {/* Thematic Background Image */}
                    {showPrayerBg && (
                      <div
                        className="absolute inset-0 transition-opacity duration-700 bg-cover bg-center pointer-events-none"
                        style={{
                          backgroundImage: `url(${PRAYER_IMAGES[name]})`,
                          opacity: prayerBgOpacity / 100
                        }}
                      />
                    )}

                    <div className="relative z-10 flex justify-between items-start mb-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${PRAYER_COLORS[name]}`}>{name}</div>
                      <div className="text-3xl font-black text-slate-800 dark:text-slate-100 font-arabic">{prayer?.time || '--:--'}</div>
                    </div>
                    <div className="relative z-10 pt-2">
                      {loggedToday ? (
                        <div className="space-y-3">
                          <div
                            className="flex items-center justify-between text-emerald-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-1 transition-colors"
                            onClick={() => handleEditPrayer(loggedToday)}
                            title="Klik untuk ubah detail"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-6 h-6" />
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pelaksanaan</p>
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${loggedToday.status === 'Tepat Waktu' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                                    {loggedToday.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{loggedToday.actualTime}</p>
                                  {loggedToday.delayMinutes > 0 && (
                                    <span className={`text-[10px] font-bold ${loggedToday.status === 'Tepat Waktu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                      (+{loggedToday.delayMinutes}m)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          {loggedToday.locationType && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{loggedToday.locationType}</span>
                            </div>
                          )}
                          {loggedToday.isMasbuq && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50">
                              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Masbuq: {loggedToday.masbuqRakaat} Rakaat</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Button
                            className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10"
                            disabled={!prayer || !isPassed}
                            onClick={() => prayer && handlePrayerClick(name, prayer.time)}
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
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard logs={state.logs} />}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 lg:px-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Log Pelaksanaan</h3>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Date Filter */}
                <div className="flex items-center gap-2 flex-1 md:flex-none">
                  <div className="relative flex-1 md:flex-none">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={historyDateFilter}
                      onChange={(e) => setHistoryDateFilter(e.target.value)}
                      className="pl-10 pr-4 py-2.5 w-full md:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  {historyDateFilter && (
                    <button
                      onClick={() => setHistoryDateFilter('')}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      title="Tampilkan Semua"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick Date Navigation */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                  <button
                    onClick={() => {
                      const d = historyDateFilter ? new Date(historyDateFilter) : new Date();
                      d.setDate(d.getDate() - 1);
                      setHistoryDateFilter(d.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Hari Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setHistoryDateFilter(new Date().toISOString().split('T')[0])}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => {
                      const d = historyDateFilter ? new Date(historyDateFilter) : new Date();
                      d.setDate(d.getDate() + 1);
                      if (d <= new Date()) {
                        setHistoryDateFilter(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Hari Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                <button
                  onClick={handleResetData}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/50 transition-all bg-white dark:bg-slate-900 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden md:inline">Reset Data</span>
                </button>
              </div>
            </div>

            {/* Filter Status */}
            {historyDateFilter && (
              <div className="px-4 lg:px-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-400">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-sm font-bold">
                    Menampilkan: {new Date(historyDateFilter).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {['Tanggal', 'Sholat', 'Waktu', 'Status', 'Lokasi', 'Masbuq', 'Alasan'].map(h => <th key={h} className="px-6 lg:px-8 py-5 text-[11px] font-black uppercase text-slate-400 whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...state.logs]
                      .filter(log => !historyDateFilter || log.date === historyDateFilter)
                      .reverse()
                      .map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => handleEditPrayer(log)}>
                          <td className="px-6 lg:px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{log.date}</td>
                          <td className="px-6 lg:px-8 py-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${PRAYER_COLORS[log.prayerName]}`}>{log.prayerName}</span></td>
                          <td className="px-6 lg:px-8 py-5 text-sm font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {log.actualTime}
                            {log.delayMinutes > 0 && (
                              <span className={`text-[10px] ml-2 font-bold ${log.status === 'Tepat Waktu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                +{log.delayMinutes}m
                              </span>
                            )}
                            <span className="opacity-30 text-[10px] font-bold ml-2">({log.scheduledTime})</span>
                          </td>
                          <td className="px-6 lg:px-8 py-5"><span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${log.status === 'Tepat Waktu' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'}`}>{log.status}</span></td>
                          <td className="px-6 lg:px-8 py-5">
                            {log.locationType ? (
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.locationType}</span>
                            ) : (
                              <span className="text-sm text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-6 lg:px-8 py-5">
                            {log.isMasbuq ? (
                              <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase whitespace-nowrap">Masbuq ({log.masbuqRakaat})</span>
                            ) : (
                              <span className="text-sm text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-6 lg:px-8 py-5 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{log.reason || '-'}</td>
                        </tr>
                      ))}
                    {state.logs.filter(log => !historyDateFilter || log.date === historyDateFilter).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-3">
                            <CalendarDays className="w-12 h-12 opacity-30" />
                            <p className="text-sm font-bold">Tidak ada data untuk tanggal ini</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Late Prayer Reason Modal */}
      {lateModalOpen && pendingLatePrayer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Clock3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Konfirmasi Sholat {pendingLatePrayer.name}</h3>
                <p className="text-sm text-slate-500 font-medium">Waktu saat ini melewati jadwal ({pendingLatePrayer.scheduledTime})</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lokasi</p>
                  <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
                    <button
                      onClick={() => setLocationType('Masjid')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${locationType === 'Masjid' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Masjid
                    </button>
                    <button
                      onClick={() => setLocationType('Rumah')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${locationType === 'Rumah' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Rumah
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Masbuq?</p>
                  <button
                    onClick={() => setIsMasbuq(!isMasbuq)}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${isMasbuq ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-white dark:bg-slate-900 border-transparent text-slate-500'}`}
                  >
                    {isMasbuq ? 'Ya' : 'Tidak'}
                  </button>
                </div>
              </div>

              {isMasbuq && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 animate-in zoom-in-95 duration-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-3 text-center">Berapa rakaat {isMasbuq ? "(Masbuq)" : ""} yang tertinggal?</p>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: PRAYER_RAKAAT[pendingLatePrayer.name] }, (_, i) => i + 1).map(r => (
                      <button
                        key={r}
                        onClick={() => setMasbuqRakaat(r)}
                        className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center transition-all ${masbuqRakaat === r ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLateEntry && !editingLogId && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Tandai Sebagai</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsForgotMarking(false)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all group ${!isForgotMarking ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 shadow-md shadow-amber-500/10' : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'}`}
                    >
                      <Clock className={`w-6 h-6 mb-2 transition-transform ${!isForgotMarking ? 'text-amber-600 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${!isForgotMarking ? 'text-amber-800 dark:text-amber-400' : 'text-slate-500'}`}>Memang Telat</span>
                    </button>
                    <button
                      onClick={() => setIsForgotMarking(true)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all group ${isForgotMarking ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'}`}
                    >
                      <CheckCircle className={`w-6 h-6 mb-2 transition-transform ${isForgotMarking ? 'text-emerald-600 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isForgotMarking ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-500'}`}>Lupa Menandai</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  placeholder="Contoh: meeting panjang, dll..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 font-medium resize-none shadow-inner"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 h-14 font-bold text-slate-500"
                  onClick={() => {
                    setLateModalOpen(false);
                    setPendingLatePrayer(null);
                    setLateReason('');
                  }}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                  onClick={confirmLatePrayer}
                >
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
