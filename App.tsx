
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  RotateCcw,
  Home,
  Users,
  CloudRain,
  SunMedium,
  ChevronDown
} from 'lucide-react';

// Shared
import { PrayerLog, DailySchedule, PrayerName, AppSettings } from './shared/types';
import { STORAGE_KEYS, PRAYER_ORDER, PRAYER_COLORS, PRAYER_IMAGES, CURRENT_VERSION } from './shared/constants';
import { getCurrentTimeStr, formatDate, isTimePassed, getLocalDateStr, getYesterdayDateStr, isLate, calculateDelay } from './shared/utils/helpers';
import { searchLocations } from './features/prayer/services/prayerService';
import { Button } from './shared/components/ui/Button';

// Features
import { useAuth } from './features/auth/hooks/useAuth';
import { useSettings } from './features/settings/hooks/useSettings';
import { usePrayerSchedule } from './features/prayer/hooks/usePrayerSchedule';
import { usePrayerLogs } from './features/prayer/hooks/usePrayerLogs';
import { useSync } from './features/sync/hooks/useSync';

import { AuthStatus } from './features/auth/components/AuthStatus';
import { PrayerCard } from './features/prayer/components/PrayerCard';
import { LatePrayerModal } from './features/prayer/components/LatePrayerModal';
import { SyncConfirmModal } from './features/sync/components/SyncConfirmModal';
import { Dashboard } from './features/dashboard/components/Dashboard';
import IslamicCelebration from './features/dashboard/components/IslamicCelebration';

const App: React.FC = () => {
  // Hooks
  const { user, setUser, logout, initGoogle } = useAuth();
  const {
    themeMode, cycleTheme, showPrayerBg, setShowPrayerBg, prayerBgOpacity, setPrayerBgOpacity,
    locationHistory, getCurrentSettings, restoreSettings, addToHistory
  } = useSettings();
  const {
    schedule, setSchedule, yesterdaySchedule, setYesterdaySchedule, isLoading, error, setError, getSchedule, getYesterdaySchedule
  } = usePrayerSchedule();
  const { logs, setLogs, logPrayer, deleteLog, clearLogs } = usePrayerLogs();
  const { isSyncing, handleUpload, handleDownload, hasBackup, handleRevert } = useSync(user?.email);

  // Local States
  const [activeTab, setActiveTab] = useState<'tracker' | 'dashboard' | 'history'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) as any) || 'tracker';
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeStr());
  const [currentDate, setCurrentDate] = useState(getLocalDateStr());
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const isFlashbackMode = selectedDate !== currentDate;

  const [lateModalOpen, setLateModalOpen] = useState(false);
  const [pendingLatePrayer, setPendingLatePrayer] = useState<{ name: PrayerName; scheduledTime: string } | null>(null);
  const [lateReason, setLateReason] = useState('');
  const [isMasbuq, setIsMasbuq] = useState(false);
  const [masbuqRakaat, setMasbuqRakaat] = useState(1);
  const [locationType, setLocationType] = useState<'Rumah' | 'Masjid'>('Masjid');
  const [executionType, setExecutionType] = useState<'Jamaah' | 'Munfarid'>('Jamaah');
  const [weatherCondition, setWeatherCondition] = useState<'Cerah' | 'Hujan'>('Cerah');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isLateEntry, setIsLateEntry] = useState(false);
  const [isForgotMarking, setIsForgotMarking] = useState(false);
  const [hasDzikir, setHasDzikir] = useState(false);
  const [hasQobliyah, setHasQobliyah] = useState(false);
  const [hasBadiyah, setHasBadiyah] = useState(false);
  const [hasDua, setHasDua] = useState(false);
  const [isSunnahExpanded, setIsSunnahExpanded] = useState(false);

  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [pendingCloudLogs, setPendingCloudLogs] = useState<PrayerLog[] | null>(null);
  const [pendingCloudSettings, setPendingCloudSettings] = useState<AppSettings | null>(null);
  const [pendingLastUpdated, setPendingLastUpdated] = useState<number | null>(null);

  const [showCelebration, setShowCelebration] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showMasbuqPicker, setShowMasbuqPicker] = useState(false);

  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Refs
  const searchTimeoutRef = useRef<number | null>(null);
  const googleBtnSidebarRef = useRef<HTMLDivElement>(null);
  const googleBtnHeaderRef = useRef<HTMLDivElement>(null);
  const lastDateRef = useRef(currentDate);
  const sliderTimerRef = useRef<number | null>(null);

  const resetSliderTimer = useCallback(() => {
    if (sliderTimerRef.current) window.clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = window.setTimeout(() => {
      setShowOpacitySlider(false);
    }, 5000);
  }, []);

  // Derived
  const filteredHistoryLogs = useMemo(() => {
    return [...logs]
      .filter(log => !historyDateFilter || log.date === historyDateFilter)
      .reverse();
  }, [logs, historyDateFilter]);

  const totalPages = Math.ceil(filteredHistoryLogs.length / ITEMS_PER_PAGE);
  const currentHistoryLogs = filteredHistoryLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Sync active tab to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Version check
  useEffect(() => {
    const savedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    if (savedVersion !== CURRENT_VERSION) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('al_rizq_api_cache_') || key === STORAGE_KEYS.SCHEDULE) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(STORAGE_KEYS.APP_VERSION, CURRENT_VERSION);
      if (schedule) getSchedule();
    }
  }, []);

  // Clock & Midnight check
  useEffect(() => {
    const updateTimeAndDate = () => {
      setCurrentTime(getCurrentTimeStr());
      const today = getLocalDateStr();
      if (today !== lastDateRef.current) {
        lastDateRef.current = today;
        setCurrentDate(today);
        setHistoryDateFilter(today);
      }
    };
    updateTimeAndDate();
    const interval = setInterval(updateTimeAndDate, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync Google script
  const handleGoogleCallback = useCallback(async (response: any) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData = { name: payload.name, email: payload.email, picture: payload.picture };
      setUser(userData);
      localStorage.setItem('al_rizq_user', JSON.stringify(userData));

      const cloudData = await handleDownload();
      if (cloudData && (cloudData.logs?.length > 0 || cloudData.settings)) {
        if (logs.length === 0) {
          if (cloudData.logs) {
            setLogs(cloudData.logs);
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(cloudData.logs));
          }
          if (cloudData.settings) restoreSettings(cloudData.settings);
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, cloudData.last_updated.toString());
        } else {
          setPendingCloudLogs(cloudData.logs);
          setPendingCloudSettings(cloudData.settings || null);
          setPendingLastUpdated(cloudData.last_updated);
          setSyncConfirmOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [logs.length, setUser, handleDownload, restoreSettings, setLogs]);

  useEffect(() => {
    initGoogle(handleGoogleCallback);
  }, [initGoogle, handleGoogleCallback]);

  // Re-init Google when logged out
  useEffect(() => {
    if (!user && (window as any).google?.accounts?.id) {
      initGoogle(handleGoogleCallback);
    }
  }, [user, initGoogle, handleGoogleCallback]);

  // Render Google buttons
  useEffect(() => {
    const renderBtn = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (ref.current && (window as any).google?.accounts?.id) {
        ref.current.innerHTML = '';
        (window as any).google.accounts.id.renderButton(ref.current, {
          type: 'icon', shape: 'circle', theme: 'filled_blue', size: 'large',
        });
      }
    };
    renderBtn(googleBtnSidebarRef);
    renderBtn(googleBtnHeaderRef);
  }, [user, initGoogle]);

  // Yesterday schedule for flashback
  useEffect(() => {
    if (isFlashbackMode && !yesterdaySchedule) {
      getYesterdaySchedule();
    }
  }, [isFlashbackMode, yesterdaySchedule, getYesterdaySchedule]);

  // Refresh schedule if new day
  useEffect(() => {
    if (schedule && schedule.date !== currentDate) {
      getSchedule();
      setYesterdaySchedule(null);
    }
  }, [currentDate, schedule, getSchedule]);

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
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 500);
  }, [searchQuery]);

  // Handlers
  const handlePrayerClick = (name: PrayerName, scheduledTime: string) => {
    if (isFlashbackMode) {
      setEditingLogId(null);
      setPendingLatePrayer({ name, scheduledTime });
      setLateModalOpen(true);
      setIsLateEntry(true);
      setIsForgotMarking(true);
      return;
    }

    const actualTime = getCurrentTimeStr();
    if (isTimePassed(scheduledTime, currentDate) && isLate(scheduledTime, actualTime)) {
      setEditingLogId(null);
      setPendingLatePrayer({ name, scheduledTime });
      setLateModalOpen(true);
      setIsLateEntry(true);
      setIsForgotMarking(false);
    } else {
      logPrayer(name, scheduledTime, { locationType: 'Masjid', executionType: 'Jamaah', weatherCondition: 'Cerah' });
      setShowCelebration(true);
    }
  };

  const handleEditPrayer = (log: PrayerLog) => {
    setEditingLogId(log.id);
    setPendingLatePrayer({ name: log.prayerName, scheduledTime: log.scheduledTime });
    setLateReason(log.reason || '');
    setIsMasbuq(log.isMasbuq || false);
    setMasbuqRakaat(log.masbuqRakaat || 1);
    setLocationType(log.locationType || 'Masjid');
    setExecutionType(log.executionType || 'Jamaah');
    setWeatherCondition(log.weatherCondition || 'Cerah');
    setHasDzikir(log.hasDzikir || false);
    setHasQobliyah(log.hasQobliyah || false);
    setHasBadiyah(log.hasBadiyah || false);
    setHasDua(log.hasDua || false);
    setIsLateEntry(true);
    setLateModalOpen(true);
  };

  const confirmLatePrayer = () => {
    if (pendingLatePrayer) {
      logPrayer(pendingLatePrayer.name, pendingLatePrayer.scheduledTime, {
        reason: lateReason,
        isForgot: isForgotMarking,
        isMasbuq,
        masbuqRakaat,
        locationType,
        executionType,
        weatherCondition,
        hasDzikir,
        hasQobliyah,
        hasBadiyah,
        hasDua,
        editingLogId,
        selectedDate: isFlashbackMode ? selectedDate : undefined
      });

      const curTime = getCurrentTimeStr();
      const isOnTime = !isLate(pendingLatePrayer.scheduledTime, curTime);

      if (isOnTime && locationType === 'Masjid' && executionType === 'Jamaah') {
        setShowCelebration(true);
      }

      setLateModalOpen(false);
      setPendingLatePrayer(null);
      setLateReason('');
      setIsMasbuq(false);
      setEditingLogId(null);
    }
  };
  const confirmCloudReplace = () => {
    if (pendingCloudLogs) {
      localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(logs));
      localStorage.setItem('al_rizq_backup_source', 'download');
      setLogs(pendingCloudLogs);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(pendingCloudLogs));
      if (pendingCloudSettings) restoreSettings(pendingCloudSettings);
      if (pendingLastUpdated) localStorage.setItem(STORAGE_KEYS.LAST_SYNC, pendingLastUpdated.toString());
    }
    setSyncConfirmOpen(false);
    setPendingCloudLogs(null);
    setPendingCloudSettings(null);
  };

  const keepLocalData = () => {
    setSyncConfirmOpen(false);
    setPendingCloudLogs(null);
    setPendingCloudSettings(null);
    handleUpload(logs, getCurrentSettings());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row font-sans selection:bg-emerald-100 dark:selection:bg-emerald-900 selection:text-emerald-900 dark:selection:text-emerald-100">
      {/* Sidebar for Desktop, Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:sticky lg:top-0 lg:w-72 lg:h-screen lg:z-50 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-100 dark:border-slate-800 p-6 lg:p-6 flex flex-col items-center gap-8 lg:relative rounded-t-[2.5rem] lg:rounded-none shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] lg:shadow-none">
        <div className="hidden lg:flex items-center gap-3 self-start px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <span className="text-white font-black text-xl">R</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">AL-RIZQ <span className="text-emerald-600">APP</span></h1>
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
                  type="range" min="0" max="40" step="5" value={prayerBgOpacity}
                  onChange={(e) => setPrayerBgOpacity(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 w-6 text-right">{prayerBgOpacity}%</span>
              </div>
            )}
          </div>

          <AuthStatus user={user} onLogout={logout} googleBtnRef={googleBtnSidebarRef} mode="sidebar" />
        </div>
      </nav>

      <main className="flex-1 p-4 lg:p-10 max-w-6xl mx-auto w-full pb-48 lg:pb-0">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-10 gap-6">
          <div className="flex justify-between items-start flex-1">
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {activeTab === 'tracker' ? 'Tracker Sholat' : activeTab === 'dashboard' ? 'Statistik' : 'Riwayat'}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] lg:text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm w-fit">
                  <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-emerald-600" /> {formatDate(selectedDate)}
                </span>
                {activeTab === 'tracker' && (isFlashbackMode ? yesterdaySchedule : schedule) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-full text-[10px] lg:text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm w-fit animate-in fade-in slide-in-from-left-2 duration-500">
                    <Info className="w-3 h-3 text-emerald-600" /> {(isFlashbackMode ? yesterdaySchedule : schedule)?.sources?.[0]?.title || 'Kemenag RI'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <button onClick={cycleTheme} className="p-2 lg:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
                {themeMode === 'light' && <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />}
                {themeMode === 'dark' && <Moon className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />}
                {themeMode === 'system' && <Monitor className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />}
              </button>

              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative">
                <button
                  onClick={() => {
                    if (!showPrayerBg) {
                      setShowPrayerBg(true); setShowOpacitySlider(true); resetSliderTimer();
                    } else {
                      setShowPrayerBg(false); setShowOpacitySlider(false);
                      if (sliderTimerRef.current) window.clearTimeout(sliderTimerRef.current);
                    }
                  }}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${showPrayerBg ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${showPrayerBg ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                {showPrayerBg && showOpacitySlider && (
                  <div className="absolute top-full right-0 mt-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 min-w-[200px] animate-in slide-in-from-top-2 duration-300" onMouseEnter={() => { if (sliderTimerRef.current) window.clearTimeout(sliderTimerRef.current); }} onMouseLeave={resetSliderTimer}>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opacity</span><span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{prayerBgOpacity}%</span></div>
                      <input type="range" min="0" max="40" step="5" value={prayerBgOpacity} onChange={(e) => { setPrayerBgOpacity(parseInt(e.target.value)); resetSliderTimer(); }} className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    </div>
                    <button onClick={() => setShowOpacitySlider(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <AuthStatus user={user} onLogout={logout} googleBtnRef={googleBtnHeaderRef} mode="header" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 lg:gap-3 w-full md:w-auto">
            {activeTab === 'tracker' && (
              <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                <button onClick={() => setIsSearching(!isSearching)} className="flex-1 md:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:border-emerald-500 transition-all overflow-hidden min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex-1 md:max-w-[150px]">{schedule?.location || 'Cari lokasi...'}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isSearching ? 'rotate-90' : ''}`} />
                </button>
                <Button variant="ghost" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shrink-0" onClick={() => getSchedule()} isLoading={isLoading && !isSearching}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}

            {user && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shrink-0 flex items-center gap-2"
                  onClick={() => handleUpload(logs, getCurrentSettings())}
                  isLoading={isSyncing && !isLoading}
                  title="Upload Riwayat ke Cloud"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shrink-0 flex items-center gap-2"
                  onClick={async () => {
                    const result = await handleDownload();
                    if (result) {
                      setLogs(result.logs);
                      if (result.settings) restoreSettings(result.settings);
                      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(result.logs));
                      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, result.last_updated.toString());
                    }
                  }}
                  isLoading={isSyncing && !isLoading}
                  title="Download Riwayat dari Cloud"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Download</span>
                </Button>
                {hasBackup && (
                  <Button
                    variant="ghost"
                    className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 p-2.5 shrink-0 flex items-center gap-2"
                    onClick={async () => {
                      const result = await handleRevert(logs);
                      if (result) setLogs(result);
                    }}
                    title="Batalkan Sinkronisasi"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Revert</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Tracker Tab Content */}
        {activeTab === 'tracker' && (
          <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {isSearching && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl animate-in zoom-in-95 duration-300 relative z-40">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Masukkan nama kota (min. 3 huruf)..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 font-bold placeholder:text-slate-400"
                    autoFocus
                  />
                  {isSearchingSuggestions && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-spin" />}
                </div>

                {suggestions.length > 0 && (
                  <div className="mt-4 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-4">
                    {suggestions.map((loc, i) => (
                      <button key={i} onClick={() => { getSchedule({ address: loc }); addToHistory(loc); setIsSearching(false); setSearchQuery(''); }} className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors group">
                        <MapPin className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" /> {loc}
                      </button>
                    ))}
                  </div>
                )}

                {locationHistory.length > 0 && !searchQuery && (
                  <div className="mt-6">
                    <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Riwayat Lokasi</p>
                    <div className="space-y-1">
                      {locationHistory.map((loc, i) => (
                        <button key={i} onClick={() => { getSchedule({ address: loc }); setIsSearching(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between group">
                          <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-slate-300" /> {loc}</div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-4 text-rose-800 dark:text-rose-300 animate-in shake-x duration-500">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="font-bold text-sm flex-1">{error}</p>
                <button onClick={() => setError(null)} className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>
            )}

            {user && (
              <div className="flex md:hidden items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500 -mt-4">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 shrink-0"
                  onClick={() => handleUpload(logs, getCurrentSettings())}
                  isLoading={isSyncing && !isLoading}
                  title="Upload Riwayat ke Cloud"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest ml-1">Upload</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 shrink-0"
                  onClick={async () => {
                    const result = await handleDownload();
                    if (result) {
                      setLogs(result.logs);
                      if (result.settings) restoreSettings(result.settings);
                      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(result.logs));
                      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, result.last_updated.toString());
                    }
                  }}
                  isLoading={isSyncing && !isLoading}
                  title="Download Riwayat dari Cloud"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest ml-1">Download</span>
                </Button>
                {hasBackup && (
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 py-3 shrink-0"
                    onClick={async () => {
                      const result = await handleRevert(logs);
                      if (result) setLogs(result);
                    }}
                    title="Batalkan Sinkronisasi"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest ml-1">Revert</span>
                  </Button>
                )}
              </div>
            )}

            {!isFlashbackMode && (
              <div className="flex flex-col md:flex-row gap-4">
                <button onClick={() => setSelectedDate(getYesterdayDateStr())} className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all group flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Clock3 className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Flashback</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">Lupa Tandai Kemarin?</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex-1 bg-emerald-600 dark:bg-emerald-900/40 p-5 rounded-3xl flex items-center justify-between text-white shadow-lg shadow-emerald-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 opacity-60 mb-0.5">Jam Sekarang</p>
                      <p className="text-2xl font-black tabular-nums">{currentTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isFlashbackMode && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-[2rem] border border-amber-200 dark:border-amber-900/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <RotateCcw className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-900 dark:text-amber-400">Mode Flashback Aktif</h3>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-500/80">Menampilkan jadwal sholat untuk <span className="underline">{formatDate(selectedDate)}</span></p>
                  </div>
                </div>
                <button onClick={() => { setSelectedDate(currentDate); setYesterdaySchedule(null); }} className="px-6 py-3 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-black rounded-2xl text-xs uppercase tracking-widest shadow-sm border border-amber-200 dark:border-amber-900/50 hover:bg-amber-500 hover:text-white transition-all">Kembali ke Hari Ini</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRAYER_ORDER.map((name) => {
                const activeSchedule = isFlashbackMode ? yesterdaySchedule : schedule;
                const prayer = activeSchedule?.prayers.find(p => p.name === name);
                const loggedToday = logs.find(l => l.date === selectedDate && l.prayerName === name);
                const isPassed = isFlashbackMode ? true : (prayer ? isTimePassed(prayer.time, currentDate) : false);

                return (
                  <PrayerCard
                    key={name} name={name} time={prayer?.time || '--:--'} loggedToday={loggedToday} isPassed={isPassed} isFlashbackMode={isFlashbackMode} showPrayerBg={showPrayerBg} prayerBgOpacity={prayerBgOpacity}
                    onPrayerClick={handlePrayerClick} onEditPrayer={handleEditPrayer}
                  />
                );
              })}
            </div>

          </div>
        )}

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && <Dashboard logs={logs} />}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-0.5">Filter Aktif</p>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                  Menampilkan: {formatDate(historyDateFilter || getLocalDateStr())}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative flex-1 group">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input type="date" value={historyDateFilter} onChange={(e) => { setHistoryDateFilter(e.target.value); setCurrentPage(1); }} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                  {historyDateFilter && <button onClick={() => { setHistoryDateFilter(''); setCurrentPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm shrink-0">
                  <button
                    onClick={() => {
                      const d = new Date(historyDateFilter || getLocalDateStr());
                      d.setDate(d.getDate() - 1);
                      setHistoryDateFilter(d.toISOString().split('T')[0]);
                      setCurrentPage(1);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all hover:text-emerald-500"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-100 dark:bg-slate-800 mx-1" />
                  <button
                    onClick={() => {
                      setHistoryDateFilter(getLocalDateStr());
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600 transition-all"
                    title="Kembali ke Hari Ini"
                  >
                    Hari Ini
                  </button>
                  <div className="w-[1px] h-4 bg-slate-100 dark:bg-slate-800 mx-1" />
                  <button
                    onClick={() => {
                      const d = new Date(historyDateFilter || getLocalDateStr());
                      d.setDate(d.getDate() + 1);
                      setHistoryDateFilter(d.toISOString().split('T')[0]);
                      setCurrentPage(1);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all hover:text-emerald-500"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="danger-outline" className="rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-bold" onClick={clearLogs}><Trash2 className="w-4 h-4" /> Hapus Semua</Button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tanggal</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sholat</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Waktu</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lokasi</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pelaksanaan</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cuaca</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Masbuq</th>
                      <th className="px-6 lg:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentHistoryLogs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 lg:px-8 py-5"><p className="text-xs font-bold text-slate-800 dark:text-slate-100">{log.date}</p></td>
                        <td className="px-6 lg:px-8 py-5"><span className="text-xs font-black uppercase tracking-widest text-emerald-600">{log.prayerName}</span></td>
                        <td className="px-6 lg:px-8 py-5"><p className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.actualTime}</p></td>
                        <td className="px-6 lg:px-8 py-5">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${log.status === 'Tepat Waktu' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-500'}`}>
                            {log.status} {log.delayMinutes > 0 && `(${log.delayMinutes}m)`}
                          </span>
                        </td>
                        <td className="px-6 lg:px-8 py-5">{log.locationType ? <div className="flex items-center gap-1.5">{log.locationType === 'Masjid' ? <MapPin className="w-3 h-3 text-emerald-600" /> : <Home className="w-3 h-3 text-slate-400" />}<span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.locationType}</span></div> : <span className="text-sm text-slate-300">-</span>}</td>
                        <td className="px-6 lg:px-8 py-5">{log.executionType ? <div className="flex items-center gap-1.5">{log.executionType === 'Jamaah' ? <Users className="w-3 h-3 text-emerald-600" /> : <User className="w-3 h-3 text-slate-400" />}<span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.executionType}</span></div> : <span className="text-sm text-slate-300">-</span>}</td>
                        <td className="px-6 lg:px-8 py-5">{log.weatherCondition ? <div className="flex items-center gap-1.5">{log.weatherCondition === 'Hujan' ? <CloudRain className="w-3 h-3 text-blue-500" /> : <SunMedium className="w-3 h-3 text-amber-500" />}<span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.weatherCondition}</span></div> : <span className="text-sm text-slate-300">-</span>}</td>
                        <td className="px-6 lg:px-8 py-5">{log.isMasbuq ? <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase whitespace-nowrap">Masbuq ({log.masbuqRakaat})</span> : <span className="text-sm text-slate-300">-</span>}</td>
                        <td className="px-6 lg:px-8 py-5 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{log.reason || '-'}</td>
                      </tr>
                    ))}
                    {currentHistoryLogs.length === 0 && (
                      <tr><td colSpan={9} className="px-8 py-12 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><CalendarDays className="w-12 h-12 opacity-30" /><p className="text-sm font-bold">Tidak ada data untuk tanggal ini</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"><ChevronLeft className="w-3.5 h-3.5" />Prev</button>
                  <span className="text-xs font-bold text-slate-500">Hal {currentPage} dari {totalPages}</span>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">Next<ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <LatePrayerModal
        isOpen={lateModalOpen} onClose={() => { setLateModalOpen(false); setPendingLatePrayer(null); setLateReason(''); }}
        pendingLatePrayer={pendingLatePrayer} lateReason={lateReason} setLateReason={setLateReason} isMasbuq={isMasbuq} setIsMasbuq={setIsMasbuq} masbuqRakaat={masbuqRakaat} setMasbuqRakaat={setMasbuqRakaat} locationType={locationType} setLocationType={setLocationType} executionType={executionType} setExecutionType={setExecutionType} weatherCondition={weatherCondition} setWeatherCondition={setWeatherCondition} editingLogId={editingLogId} isLateEntry={isLateEntry} isForgotMarking={isForgotMarking} setIsForgotMarking={setIsForgotMarking} showMasbuqPicker={showMasbuqPicker} setShowMasbuqPicker={setShowMasbuqPicker} hasDzikir={hasDzikir} setHasDzikir={setHasDzikir} hasQobliyah={hasQobliyah} setHasQobliyah={setHasQobliyah} hasBadiyah={hasBadiyah} setHasBadiyah={setHasBadiyah} hasDua={hasDua} setHasDua={setHasDua} isSunnahExpanded={isSunnahExpanded} setIsSunnahExpanded={setIsSunnahExpanded} onConfirm={confirmLatePrayer}
      />

      <SyncConfirmModal isOpen={syncConfirmOpen} onConfirm={confirmCloudReplace} onCancel={keepLocalData} />

      <IslamicCelebration show={showCelebration} onComplete={() => setShowCelebration(false)} />
    </div>
  );
};

export default App;
