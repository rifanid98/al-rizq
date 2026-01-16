
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

import { PrayerLog, AppState, DailySchedule, PrayerName, UserProfile, AppSettings } from './types';
import { STORAGE_KEYS, PRAYER_ORDER, PRAYER_COLORS, PRAYER_RAKAAT, PRAYER_IMAGES, CURRENT_VERSION } from './constants';
import { fetchPrayerTimes, searchLocations } from './services/prayerService';
import { uploadToCloud, downloadFromCloud, shouldAutoSync } from './services/syncService';
import { getCurrentTimeStr, calculateDelay, isLate, formatDate, isTimePassed, getLocalDateStr, getYesterdayDateStr } from './utils/helpers';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/ui/Button';
import IslamicCelebration from './components/IslamicCelebration';

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
    const savedLocationHistory = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
    const savedTheme = localStorage.getItem('al_rizq_theme') as any;
    const savedShowBg = localStorage.getItem('al_rizq_show_bg');
    const savedBgOpacity = localStorage.getItem('al_rizq_bg_opacity');

    return {
      logs: savedLogs ? JSON.parse(savedLogs) : [],
      schedule: savedSchedule ? JSON.parse(savedSchedule) : null,
      location: null,
      isLoading: false,
      error: null,
      user: savedUser ? JSON.parse(savedUser) : null,
      isSyncing: false,
      settings: {
        theme: savedTheme || 'system',
        locationHistory: savedLocationHistory ? JSON.parse(savedLocationHistory) : [],
        showPrayerBg: savedShowBg !== null ? JSON.parse(savedShowBg) : true,
        prayerBgOpacity: savedBgOpacity !== null ? JSON.parse(savedBgOpacity) : 10
      }
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
  const [currentDate, setCurrentDate] = useState(getLocalDateStr());
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const isFlashbackMode = selectedDate !== currentDate;
  const [yesterdaySchedule, setYesterdaySchedule] = useState<DailySchedule | null>(null);

  // Late prayer reason modal state
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
  const [hasBackup, setHasBackup] = useState(!!localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP));
  const [backupSource, setBackupSource] = useState<'upload' | 'download' | null>(() => {
    return (localStorage.getItem('al_rizq_backup_source') as 'upload' | 'download') || null;
  });
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [pendingCloudLogs, setPendingCloudLogs] = useState<PrayerLog[] | null>(null);
  const [pendingLastUpdated, setPendingLastUpdated] = useState<number | null>(null);

  const isYesterdayComplete = useMemo(() => {
    const yesterday = getYesterdayDateStr();
    return PRAYER_ORDER.every(name => state.logs.some(l => l.date === yesterday && l.prayerName === name));
  }, [state.logs]);

  const [isYesterdayConfirmed, setIsYesterdayConfirmed] = useState(() => {
    const yesterday = getYesterdayDateStr();
    return localStorage.getItem(`al_rizq_confirmed_${yesterday}`) === 'true';
  });

  const [showCelebration, setShowCelebration] = useState(false);

  const [showPrayerBg, setShowPrayerBg] = useState<boolean>(() => {
    const saved = localStorage.getItem('al_rizq_show_bg');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [prayerBgOpacity, setPrayerBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('al_rizq_bg_opacity');
    return saved !== null ? JSON.parse(saved) : 10;
  });
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showMasbuqPicker, setShowMasbuqPicker] = useState(false);
  const sliderTimerRef = useRef<number | null>(null);

  const resetSliderTimer = useCallback(() => {
    if (sliderTimerRef.current) window.clearTimeout(sliderTimerRef.current);
    sliderTimerRef.current = window.setTimeout(() => {
      setShowOpacitySlider(false);
    }, 5000);
  }, []);

  // History date filter - empty string means show all
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;


  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('al_rizq_theme') as ThemeMode) || 'system';
  });

  const filteredHistoryLogs = useMemo(() => {
    return [...state.logs]
      .filter(log => !historyDateFilter || log.date === historyDateFilter)
      .reverse();
  }, [state.logs, historyDateFilter]);

  const totalPages = Math.ceil(filteredHistoryLogs.length / ITEMS_PER_PAGE);
  const currentHistoryLogs = filteredHistoryLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

  // Version check/Cache busting
  useEffect(() => {
    const savedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    if (savedVersion !== CURRENT_VERSION) {
      // Clear old cache and schedule to ensure fresh start with new logic
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('al_rizq_api_cache_') || key === STORAGE_KEYS.SCHEDULE) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(STORAGE_KEYS.APP_VERSION, CURRENT_VERSION);
      // Try to get fresh schedule
      if (state.schedule) {
        getLocationAndSchedule();
      }
    }
  }, []);

  // Update clock every 30 seconds and check for date change at midnight
  useEffect(() => {
    const updateTimeAndDate = () => {
      setCurrentTime(getCurrentTimeStr());
      const today = getLocalDateStr();

      // Critical check: if stored date is different from actual local today
      if (today !== lastDateRef.current) {
        console.log(`Date changed from ${lastDateRef.current} to ${today}`);
        lastDateRef.current = today;
        setCurrentDate(today);

        // Also clear history filter if it was set to "Today"
        setHistoryDateFilter(today);
      }
    };

    // Check immediately
    updateTimeAndDate();

    // Set up interval for every 30 seconds
    const interval = setInterval(updateTimeAndDate, 30000);

    // Also calculate time until next midnight for a precise update
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      updateTimeAndDate();
      // After midnight, re-run this effect to set a new timeout for the next day
      // But since we have the interval, it might be redundant, 
      // though this ensures it happens EXACTLY at midnight.
    }, msUntilMidnight + 100); // 100ms buffer

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
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
    // 1. Clear State
    setState(prev => ({
      ...prev,
      logs: [],
      user: null,
      isSyncing: false
    }));

    // 2. Clear Personal LocalStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('al_rizq_') && key !== 'al_rizq_theme') {
        localStorage.removeItem(key);
      }
    });

    // 3. Reset internal states
    setLocationHistory([]);
    setHasBackup(false);
    setBackupSource(null);

    // 4. Google Session
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }

    // Optional: hard reload for absolute clean start
    // window.location.reload(); 
  }, []);

  // Google Login Init
  const initGoogle = useCallback(() => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false, // Ensure it asks which account to use
        context: 'signin',
        callback: async (response: any) => {
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const userData: UserProfile = {
              name: payload.name,
              email: payload.email,
              picture: payload.picture
            };
            setState(prev => ({ ...prev, user: userData, isSyncing: true }));
            localStorage.setItem('al_rizq_user', JSON.stringify(userData));

            // Sync Logic: Check for cloud data after login
            const result = await downloadFromCloud(userData.email);
            if (result && (result.logs?.length > 0 || result.settings)) {
              setState(prev => {
                const logsExist = prev.logs.length > 0;
                if (!logsExist) {
                  // Direct replace if local is empty
                  if (result.logs) {
                    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(result.logs));
                    setState(p => ({ ...p, logs: result.logs }));
                  }
                  if (result.settings) restoreSettings(result.settings);
                  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, result.last_updated.toString());
                  return { ...prev, isSyncing: false };
                } else {
                  // Confirm if local exist
                  setPendingCloudLogs(result.logs);
                  setPendingCloudSettings(result.settings || null);
                  setPendingLastUpdated(result.last_updated);
                  setSyncConfirmOpen(true);
                  return { ...prev, isSyncing: false };
                }
              });
            } else {
              setState(prev => ({ ...prev, isSyncing: false }));
            }
          } catch (e) {
            console.error(e);
            setState(prev => ({ ...prev, isSyncing: false }));
          }
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
    const fetchYesterday = async () => {
      if (!isFlashbackMode || yesterdaySchedule || !state.location && !state.schedule?.location) return;

      try {
        const loc = state.location ? { lat: state.location.lat, lng: state.location.lng } : { address: state.schedule!.location };
        const sched = await fetchPrayerTimes(loc, getYesterdayDateStr());
        setYesterdaySchedule(sched);
      } catch (err) {
        console.error("Failed to fetch yesterday's schedule", err);
      }
    };
    fetchYesterday();
  }, [isFlashbackMode, state.location, state.schedule, yesterdaySchedule]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
    if (savedHistory) setLocationHistory(JSON.parse(savedHistory));

    // Refresh schedule if it's a new day
    if (state.schedule) {
      const todayStr = getLocalDateStr();
      if (state.schedule.date !== todayStr) {
        getLocationAndSchedule();
        setYesterdaySchedule(null); // Clear yesterday cache on day change
      }
    }
  }, [getLocationAndSchedule]);

  const getCurrentSettings = useCallback((): AppSettings => ({
    theme: themeMode,
    locationHistory: locationHistory,
    showPrayerBg: showPrayerBg,
    prayerBgOpacity: prayerBgOpacity
  }), [themeMode, locationHistory, showPrayerBg, prayerBgOpacity]);

  const restoreSettings = useCallback((s: AppSettings) => {
    if (s.theme) setThemeMode(s.theme);
    if (s.locationHistory) setLocationHistory(s.locationHistory);
    if (s.showPrayerBg !== undefined) setShowPrayerBg(s.showPrayerBg);
    if (s.prayerBgOpacity !== undefined) setPrayerBgOpacity(s.prayerBgOpacity);

    // Also update localStorage for immediate persistence
    if (s.theme) localStorage.setItem('al_rizq_theme', s.theme);
    if (s.locationHistory) localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(s.locationHistory));
    if (s.showPrayerBg !== undefined) localStorage.setItem('al_rizq_show_bg', JSON.stringify(s.showPrayerBg));
    if (s.prayerBgOpacity !== undefined) localStorage.setItem('al_rizq_bg_opacity', JSON.stringify(s.prayerBgOpacity));
  }, []);

  const [pendingCloudSettings, setPendingCloudSettings] = useState<AppSettings | null>(null);

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
      // Backup current CLOUD data before overwriting
      const result = await downloadFromCloud(state.user.email);
      if (result && result.logs && result.logs.length > 0) {
        localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(result.logs));
        localStorage.setItem('al_rizq_backup_source', 'upload');
        setHasBackup(true);
        setBackupSource('upload');
      }

      const timestamp = await uploadToCloud(state.user.email, state.logs, getCurrentSettings());
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
        localStorage.setItem('al_rizq_backup_source', 'download');
        setHasBackup(true);
        setBackupSource('download');

        setState(prev => ({ ...prev, logs: result.logs }));
        if (result.settings) restoreSettings(result.settings);
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

  const handleRevert = useCallback(async () => {
    const backup = localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP);
    const source = backupSource;

    if (!backup) return;

    const confirmMessage = source === 'upload'
      ? 'Membatalkan upload akan mengembalikan data cloud ke kondisi sebelum upload. Lanjutkan?'
      : 'Membatalkan download akan mengembalikan data lokal ke kondisi sebelum download. Lanjutkan?';

    if (window.confirm(confirmMessage)) {
      const restoredLogs = JSON.parse(backup);

      if (source === 'upload') {
        // Restore cloud data - re-upload the backed up cloud data
        if (state.user?.email) {
          setState(prev => ({ ...prev, isSyncing: true }));
          try {
            await uploadToCloud(state.user.email, restoredLogs);
            console.log('Cloud data restored successfully');
          } catch (err) {
            console.error('Failed to restore cloud data:', err);
            alert('Gagal mengembalikan data cloud. Silakan coba lagi.');
            setState(prev => ({ ...prev, isSyncing: false }));
            return;
          } finally {
            setState(prev => ({ ...prev, isSyncing: false }));
          }
        }
      } else {
        // Restore local data
        setState(prev => ({ ...prev, logs: restoredLogs }));
        localStorage.setItem(STORAGE_KEYS.LOGS, backup);
      }

      localStorage.removeItem(STORAGE_KEYS.LOGS_BACKUP);
      localStorage.removeItem('al_rizq_backup_source');
      setHasBackup(false);
      setBackupSource(null);
    }
  }, [backupSource, state.user]);

  const confirmCloudReplace = () => {
    if (pendingCloudLogs || pendingCloudSettings) {
      // Backup current logs before overwriting
      localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(state.logs));
      localStorage.setItem('al_rizq_backup_source', 'download');
      setHasBackup(true);
      setBackupSource('download');

      if (pendingCloudLogs) {
        setState(prev => ({ ...prev, logs: pendingCloudLogs }));
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(pendingCloudLogs));
      }

      if (pendingCloudSettings) {
        restoreSettings(pendingCloudSettings);
      }

      if (pendingLastUpdated) {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, pendingLastUpdated.toString());
      }
    }
    setSyncConfirmOpen(false);
    setPendingCloudLogs(null);
    setPendingCloudSettings(null);
    setPendingLastUpdated(null);
  };

  const keepLocalData = () => {
    setSyncConfirmOpen(false);
    setPendingCloudLogs(null);
    setPendingCloudSettings(null);
    setPendingLastUpdated(null);
  };

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
      setLocationType('Rumah'); // Default to Rumah for late prayers
      setExecutionType('Munfarid'); // Default to Munfarid for late prayers (often the case)
      setWeatherCondition('Hujan'); // Default to Hujan for late prayers (as user said Bogor is always rainy)
      setEditingLogId(null);
      setIsLateEntry(true);
      setIsForgotMarking(false);
      setShowMasbuqPicker(false);
      setHasDzikir(false);
      setHasQobliyah(false);
      setHasBadiyah(false);
      setHasDua(false);
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
      setExecutionType('Jamaah');
      setWeatherCondition('Cerah');
      setEditingLogId(null);
      setIsLateEntry(false);
      setIsForgotMarking(false);
      setShowMasbuqPicker(false);
      setHasDzikir(true); // Default to true if on time? Or let user pick.
      setHasQobliyah(true);
      setHasBadiyah(true);
      setHasDua(true);
      setLateModalOpen(true);
    }
  };

  const handleEditPrayer = (log: PrayerLog) => {
    setPendingLatePrayer({ name: log.prayerName, scheduledTime: log.scheduledTime });
    setLateReason(log.reason?.replace('(Lupa menandai) ', '') || '');
    setIsMasbuq(log.isMasbuq || false);
    setMasbuqRakaat(log.masbuqRakaat || 1);
    setLocationType(log.locationType || 'Masjid');
    setExecutionType(log.executionType || 'Jamaah');
    setWeatherCondition(log.weatherCondition || 'Cerah');
    setEditingLogId(log.id);
    setIsLateEntry(log.status === 'Terlambat');
    setIsForgotMarking(log.reason?.includes('(Lupa menandai)') || false);
    setShowMasbuqPicker(log.isMasbuq || false);
    setHasDzikir(log.hasDzikir || false);
    setHasQobliyah(log.hasQobliyah || false);
    setHasBadiyah(log.hasBadiyah || false);
    setHasDua(log.hasDua || false);
    setLateModalOpen(true);
  };

  const logPrayer = (prayerName: PrayerName, scheduledTime: string, reason?: string, isForgot: boolean = false, extra?: Partial<PrayerLog>) => {
    const today = getLocalDateStr();
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
        date: existingLog ? existingLog.date : (extra?.date || today),
        prayerName,
        scheduledTime,
        actualTime: existingLog ? existingLog.actualTime : (extra?.actualTime || actualTime),
        status: existingLog ? existingLog.status : status,
        delayMinutes: existingLog ? existingLog.delayMinutes : delay,
        reason: isForgot ? (reason ? `(Lupa menandai) ${reason}` : 'Lupa menandai') : (reason || undefined),
        isMasbuq: isMasbuq,
        masbuqRakaat: isMasbuq ? masbuqRakaat : undefined,
        locationType: locationType,
        executionType: executionType,
        weatherCondition: weatherCondition,
        hasDzikir: hasDzikir,
        hasQobliyah: hasQobliyah,
        hasBadiyah: hasBadiyah,
        hasDua: hasDua,
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
      // Trigger gamification ONLY for perfect scenarios in production
      const isPerfectPrayer = !isFlashbackMode && !isLateEntry && locationType === 'Masjid' && !isMasbuq && !isForgotMarking && !editingLogId;
      if (isPerfectPrayer) {
        setShowCelebration(true);
      }

      logPrayer(pendingLatePrayer.name, pendingLatePrayer.scheduledTime, lateReason.trim() || undefined, isForgotMarking, { date: selectedDate });
      setLateModalOpen(false);
      setPendingLatePrayer(null);
      setLateReason('');
      setIsMasbuq(false);
      setMasbuqRakaat(1);
      setLocationType('Masjid');
      setExecutionType('Jamaah');
      setWeatherCondition('Cerah');
      setEditingLogId(null);
      setIsLateEntry(false);
      setIsForgotMarking(false);
      setShowMasbuqPicker(false);
      setHasDzikir(false);
      setHasQobliyah(false);
      setHasBadiyah(false);
      setHasDua(false);
      setIsSunnahExpanded(false);
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] lg:text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm w-fit">
                  <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-emerald-600" /> {formatDate(selectedDate)}
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
                  <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${showPrayerBg ? 'translate-x-5' : 'translate-x-1'}`} />
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

          {activeTab === 'tracker' && (
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
            </div>
          )}
        </header>

        {activeTab === 'tracker' && (
          <>
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
          </>
        )}

        {activeTab === 'tracker' && !isYesterdayConfirmed && (
          <div className="mb-8 animate-in fade-in slide-in-from-left-2 delay-150">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Pilih Hari Pencatatan</p>
            <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  if (isFlashbackMode) {
                    // Switching from Yesterday to Today
                    if (isYesterdayComplete && !isYesterdayConfirmed) {
                      if (window.confirm("Alhamdulillah, semua sholat kemarin sudah ditandai. Apakah data ini sudah benar? Setelah dikonfirmasi, Anda tidak dapat mengubahnya lagi.")) {
                        const yesterday = getYesterdayDateStr();
                        localStorage.setItem(`al_rizq_confirmed_${yesterday}`, "true");
                        setIsYesterdayConfirmed(true);
                      }
                    }
                    setSelectedDate(currentDate);
                  }
                }}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${!isFlashbackMode ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Hari Ini
              </button>

              <button
                onClick={() => setSelectedDate(getYesterdayDateStr())}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${isFlashbackMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Kemarin
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tracker' && state.error && (
          <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" /> <p className="text-sm font-bold">{state.error}</p>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {isFlashbackMode && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center justify-between gap-3 text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <p className="text-sm font-bold">Mode Flashback Aktif: Jadwal kemarin ({formatDate(selectedDate)})</p>
                </div>
                {isYesterdayComplete && !isYesterdayConfirmed && (
                  <button
                    onClick={() => {
                      if (window.confirm("Apakah semua data sholat kemarin sudah benar? Setelah dikonfirmasi, Anda tidak dapat mengubahnya lagi.")) {
                        const yesterday = getYesterdayDateStr();
                        localStorage.setItem(`al_rizq_confirmed_${yesterday}`, "true");
                        setIsYesterdayConfirmed(true);
                        setSelectedDate(currentDate);
                      }
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
                  >
                    Konfirmasi Selesai
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {PRAYER_ORDER.map((name) => {
                const scheduleToUse = isFlashbackMode ? yesterdaySchedule : state.schedule;
                const prayer = scheduleToUse?.prayers.find(p => p.name === name);
                const loggedToday = state.logs.find(l => l.date === selectedDate && l.prayerName === name);
                const isPassed = isFlashbackMode ? true : (prayer ? isTimePassed(prayer.time, currentDate) : false);

                // In flashback mode, only show if not logged yet or if it's the one we are editing
                if (isFlashbackMode && loggedToday) {
                  // Option: Hide or show as completed. Let's show as completed for clarity.
                }

                return (
                  <div key={name} className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col transition-all hover:shadow-2xl dark:hover:shadow-emerald-950/20 hover:border-emerald-100 dark:hover:border-emerald-900 group ${isFlashbackMode && !loggedToday ? 'ring-2 ring-amber-500/20' : ''}`}>
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
                            className="relative overflow-hidden flex items-center justify-between text-emerald-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-1 transition-colors"
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
                            {loggedToday.locationType === 'Masjid' ? (
                              <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none opacity-[0.06] dark:opacity-[0.12] dark:invert">
                                <img
                                  src="assets/mosque_watermark.png"
                                  alt="Masjid"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400" title="Dilaksanakan di Rumah">
                                  <Home className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {loggedToday.isMasbuq && (
                              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Masbuq: {loggedToday.masbuqRakaat}</span>
                              </div>
                            )}
                            {loggedToday.executionType && (
                              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                {loggedToday.executionType === 'Jamaah' ? <Users className="w-3 h-3 text-emerald-600" /> : <User className="w-3 h-3 text-slate-400" />}
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{loggedToday.executionType}</span>
                              </div>
                            )}
                            {loggedToday.weatherCondition && (
                              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                {loggedToday.weatherCondition === 'Hujan' ? <CloudRain className="w-3 h-3 text-blue-500" /> : <SunMedium className="w-3 h-3 text-amber-500" />}
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{loggedToday.weatherCondition}</span>
                              </div>
                            )}
                          </div>
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
                      type={historyDateFilter ? 'date' : 'text'}
                      onFocus={(e) => e.target.type = 'date'}
                      onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                      placeholder="Pilih Tanggal"
                      value={historyDateFilter}
                      onChange={(e) => {
                        setHistoryDateFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 pr-4 py-2.5 w-full md:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400 font-sans"
                    />
                  </div>
                  {historyDateFilter && (
                    <button
                      onClick={() => {
                        setHistoryDateFilter('');
                        setCurrentPage(1);
                      }}
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
                      const d = historyDateFilter ? new Date(historyDateFilter + 'T00:00:00') : new Date();
                      d.setDate(d.getDate() - 1);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setHistoryDateFilter(`${year}-${month}-${day}`);
                      setCurrentPage(1);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Hari Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setHistoryDateFilter(currentDate);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => {
                      const d = historyDateFilter ? new Date(historyDateFilter + 'T00:00:00') : new Date();
                      d.setDate(d.getDate() + 1);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      if (dateStr <= currentDate) {
                        setHistoryDateFilter(dateStr);
                        setCurrentPage(1);
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
                      {['Tanggal', 'Sholat', 'Waktu', 'Status', 'Lokasi', 'Pelaksanaan', 'Cuaca', 'Masbuq', 'Alasan'].map(h => <th key={h} className="px-6 lg:px-8 py-5 text-[11px] font-black uppercase text-slate-400 whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentHistoryLogs.map(log => (
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
                          {log.executionType ? (
                            <div className="flex items-center gap-1.5">
                              {log.executionType === 'Jamaah' ? <Users className="w-3 h-3 text-emerald-600" /> : <User className="w-3 h-3 text-slate-400" />}
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.executionType}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          {log.weatherCondition ? (
                            <div className="flex items-center gap-1.5">
                              {log.weatherCondition === 'Hujan' ? <CloudRain className="w-3 h-3 text-blue-500" /> : <SunMedium className="w-3 h-3 text-amber-500" />}
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.weatherCondition}</span>
                            </div>
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
                    {currentHistoryLogs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-8 py-12 text-center text-slate-400">
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
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>

                  <span className="text-xs font-bold text-slate-500">
                    Hal {currentPage} dari {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Late Prayer Reason Modal */}
      {lateModalOpen && pendingLatePrayer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header - Sticky on mobile */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                  <Clock3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Konfirmasi Sholat {pendingLatePrayer.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">Waktu saat ini melewati jadwal ({pendingLatePrayer.scheduledTime})</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4 lg:space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lokasi</p>
                  <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
                    <button
                      onClick={() => {
                        setLocationType('Masjid');
                        setExecutionType('Jamaah');
                      }}
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

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pelaksanaan</p>
                  <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
                    <button
                      onClick={() => setExecutionType('Jamaah')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${executionType === 'Jamaah' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Jama'ah
                    </button>
                    <button
                      onClick={() => setExecutionType('Munfarid')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${executionType === 'Munfarid' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Munfarid
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Masbuq?</p>
                    {isMasbuq && !showMasbuqPicker && (
                      <button
                        onClick={() => setShowMasbuqPicker(true)}
                        className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight hover:underline"
                      >
                        {masbuqRakaat} &nbsp;Rakaat
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !isMasbuq;
                      setIsMasbuq(newVal);
                      setShowMasbuqPicker(newVal);
                    }}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${isMasbuq ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-white dark:bg-slate-900 border-transparent text-slate-500'}`}
                  >
                    {isMasbuq ? 'Ya' : 'Tidak'}
                  </button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cuaca</p>
                  <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
                    <button
                      onClick={() => setWeatherCondition('Cerah')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${weatherCondition === 'Cerah' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Cerah
                    </button>
                    <button
                      onClick={() => setWeatherCondition('Hujan')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${weatherCondition === 'Hujan' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Hujan
                    </button>
                  </div>
                </div>
              </div>

              {isMasbuq && showMasbuqPicker && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 animate-in zoom-in-95 duration-200 relative">
                  <button
                    onClick={() => setShowMasbuqPicker(false)}
                    className="absolute top-2 right-2 p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg text-amber-700 dark:text-amber-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-3 text-center">Berapa rakaat yang tertinggal?</p>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: PRAYER_RAKAAT[pendingLatePrayer.name] }, (_, i) => i + 1).map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          setMasbuqRakaat(r);
                          setTimeout(() => setShowMasbuqPicker(false), 300);
                        }}
                        className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center transition-all ${masbuqRakaat === r ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLateEntry && !editingLogId && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tandai Sebagai</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsForgotMarking(false);
                        setLocationType('Rumah');
                        setExecutionType('Munfarid');
                        setWeatherCondition('Hujan');
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all group ${!isForgotMarking ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 shadow-sm shadow-amber-500/10' : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'}`}
                    >
                      <Clock className={`w-4 h-4 transition-transform ${!isForgotMarking ? 'text-amber-600 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-tight ${!isForgotMarking ? 'text-amber-800 dark:text-amber-400' : 'text-slate-500'}`}>Terlambat</span>
                    </button>
                    <button
                      onClick={() => setIsForgotMarking(true)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all group ${isForgotMarking ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm shadow-emerald-500/10' : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'}`}
                    >
                      <CheckCircle className={`w-4 h-4 transition-transform ${isForgotMarking ? 'text-emerald-600 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-tight ${isForgotMarking ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-500'}`}>Lupa Tandai</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setIsSunnahExpanded(!isSunnahExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-emerald-100/30 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ibadah Sunnah & Pelengkap</p>
                  <ChevronDown className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${isSunnahExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isSunnahExpanded && (
                  <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setHasQobliyah(!hasQobliyah)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasQobliyah ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasQobliyah ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          <SunMedium className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-left leading-tight">Sunnah Qobliyah</span>
                      </button>

                      <button
                        onClick={() => setHasBadiyah(!hasBadiyah)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasBadiyah ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasBadiyah ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          <Moon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-left leading-tight">Sunnah Ba'diyah</span>
                      </button>

                      <button
                        onClick={() => setHasDzikir(!hasDzikir)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasDzikir ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasDzikir ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          <Info className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-left leading-tight">Dzikir</span>
                      </button>

                      <button
                        onClick={() => setHasDua(!hasDua)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasDua ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasDua ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-left leading-tight">Berdoa</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
            </div>

            {/* Modal Footer - Sticky */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 h-14 font-bold text-slate-500 shadow-sm"
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
      {/* Sync Confirmation Modal */}
      {syncConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                <CloudDownload className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Sinkronisasi Cloud</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                Kami menemukan data cadangan Anda di cloud. Apakah Anda ingin mengganti data lokal dengan data cloud tersebut?
              </p>

              <div className="grid grid-cols-1 w-full gap-3">
                <Button
                  onClick={confirmCloudReplace}
                  className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Gunakan Data Cloud
                </Button>
                <Button
                  variant="ghost"
                  onClick={keepLocalData}
                  className="w-full h-14 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  Tetap Gunakan Data Perangkat ini
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gamification Celebration */}
      <IslamicCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default App;
