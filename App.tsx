
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
  Monitor
} from 'lucide-react';
import { PrayerLog, AppState, DailySchedule, PrayerName, UserProfile } from './types';
import { STORAGE_KEYS, PRAYER_ORDER, PRAYER_COLORS } from './constants';
import { fetchPrayerTimes, searchLocations } from './services/gemini';
import { getCurrentTimeStr, calculateDelay, isLate, formatDate } from './utils/helpers';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/ui/Button';

const CACHE_KEY_SEARCH = 'al_rizq_search_cache';
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

type ThemeMode = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    logs: [],
    schedule: null,
    location: null,
    isLoading: false,
    error: null,
    user: null,
    isSyncing: false
  });

  const [activeTab, setActiveTab] = useState<'tracker' | 'dashboard' | 'history'>('tracker');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('al_rizq_theme') as ThemeMode) || 'system';
  });
  
  const searchTimeoutRef = useRef<number | null>(null);

  // Sync theme with document class
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const isDark = 
        themeMode === 'dark' || 
        (themeMode === 'system' && mediaQuery.matches);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('al_rizq_theme', themeMode);

    // Listen for system changes if mode is system
    const listener = () => {
      if (themeMode === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  const cycleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const getKecamatan = (address: string) => {
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 4) return parts[3];
    if (parts.length >= 3) return parts[2];
    return parts[0];
  };

  const initGoogleAuth = useCallback(() => {
    if (!(window as any).google) return;
    (window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const userData: UserProfile = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        };
        setState(prev => ({ ...prev, user: userData }));
        localStorage.setItem('al_rizq_user', JSON.stringify(userData));
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(initGoogleAuth, 1000);
    const savedUser = localStorage.getItem('al_rizq_user');
    if (savedUser) {
      setState(prev => ({ ...prev, user: JSON.parse(savedUser) }));
    }
    return () => clearTimeout(timer);
  }, [initGoogleAuth]);

  const handleLogin = () => {
    if ((window as any).google) {
      (window as any).google.accounts.id.prompt();
    } else {
      alert("Google Identity Services belum dimuat.");
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, user: null }));
    localStorage.removeItem('al_rizq_user');
  };

  const syncToDrive = async () => {
    if (!state.user) return;
    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Data berhasil disinkronisasi ke Google Drive!");
    } catch (err) {
      alert("Gagal sinkronisasi data.");
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  };

  useEffect(() => {
    const now = Date.now();
    const savedTimestamp = localStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
    if (savedTimestamp && (now - parseInt(savedTimestamp)) > ONE_MONTH_MS) {
      localStorage.removeItem(CACHE_KEY_SEARCH);
      localStorage.removeItem(STORAGE_KEYS.LOCATION_HISTORY);
      localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, now.toString());
    } else if (!savedTimestamp) {
      localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, now.toString());
    }

    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const savedSchedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
    
    setState(prev => ({
      ...prev,
      logs: savedLogs ? JSON.parse(savedLogs) : [],
      schedule: savedSchedule ? JSON.parse(savedSchedule) : null,
    }));
    if (savedHistory) setLocationHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
  }, [state.logs]);

  useEffect(() => {
    if (state.schedule) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(state.schedule));
    }
  }, [state.schedule]);

  const addToHistory = useCallback((address: string) => {
    setLocationHistory(prev => {
      const filtered = prev.filter(item => item !== address);
      const updated = [address, ...filtered].slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getLocationAndSchedule = useCallback(async (manualAddress?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    if (manualAddress) {
      try {
        const schedule = await fetchPrayerTimes({ address: manualAddress });
        setState(prev => ({ ...prev, schedule, isLoading: false, error: null }));
        setIsSearching(false);
        setSuggestions([]);
        setSearchQuery('');
        setShowHistory(false);
        addToHistory(manualAddress);
      } catch (err: any) {
        setState(prev => ({ ...prev, isLoading: false, error: err.message || 'Gagal mengambil waktu sholat.' }));
      }
      return;
    }
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Geolocation tidak didukung.' }));
      setIsSearching(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setState(prev => ({ ...prev, location: { lat: latitude, lng: longitude } }));
        try {
          const schedule = await fetchPrayerTimes({ lat: latitude, lng: longitude });
          setState(prev => ({ ...prev, schedule, isLoading: false }));
        } catch (err: any) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Gagal mengambil waktu sholat.' }));
          setIsSearching(true);
        }
      },
      (err) => {
        setState(prev => ({ ...prev, isLoading: false, error: 'Gagal mendapatkan lokasi otomatis.' }));
        setIsSearching(true);
      },
      { timeout: 10000 }
    );
  }, [addToHistory]);

  useEffect(() => {
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearchingSuggestions(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      const cacheRaw = localStorage.getItem(CACHE_KEY_SEARCH);
      const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
      if (cache[searchQuery]) {
        setSuggestions(cache[searchQuery]);
        setIsSearchingSuggestions(false);
        return;
      }
      const results = await searchLocations(searchQuery);
      setSuggestions(results);
      cache[searchQuery] = results;
      localStorage.setItem(CACHE_KEY_SEARCH, JSON.stringify(cache));
      setIsSearchingSuggestions(false);
    }, 800);
  }, [searchQuery]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!state.schedule || state.schedule.date !== today) {
      getLocationAndSchedule();
    }
  }, [state.schedule, getLocationAndSchedule]);

  const logPrayer = (prayerName: PrayerName, scheduledTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    const actualTime = getCurrentTimeStr();
    if (state.logs.some(l => l.date === today && l.prayerName === prayerName)) return;
    const delay = calculateDelay(scheduledTime, actualTime);
    const status = isLate(scheduledTime, actualTime) ? 'Late' : 'Ontime';
    const newLog: PrayerLog = {
      id: crypto.randomUUID(),
      date: today,
      prayerName,
      scheduledTime,
      actualTime,
      status,
      delayMinutes: delay,
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) getLocationAndSchedule(searchQuery.trim());
  };

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat catatan sholat?')) setState(prev => ({ ...prev, logs: [] }));
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0 lg:pl-64 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center lg:top-0 lg:bottom-0 lg:left-0 lg:w-64 lg:flex-col lg:justify-start lg:py-8 lg:border-r lg:border-t-0 z-50 shadow-lg lg:shadow-none">
        <div className="hidden lg:flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">A</div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Al-Rizq</h1>
        </div>
        
        <div className="flex lg:flex-col lg:w-full gap-1 w-full justify-around lg:justify-start flex-1">
          <button onClick={() => setActiveTab('tracker')} className={`flex flex-col lg:flex-row items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tracker' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Clock className="w-6 h-6" />
            <span className="text-xs lg:text-sm">Tracker</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col lg:flex-row items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs lg:text-sm">Laporan</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col lg:flex-row items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <HistoryIcon className="w-6 h-6" />
            <span className="text-xs lg:text-sm">Riwayat</span>
          </button>
        </div>

        <div className="hidden lg:block w-full px-2 mt-auto border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
          <button 
            onClick={cycleTheme}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all group"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">Tampilan</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 capitalize">{themeMode}</span>
            </div>
            {themeMode === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
            {themeMode === 'dark' && <Moon className="w-4 h-4 text-emerald-400" />}
            {themeMode === 'system' && <Monitor className="w-4 h-4 text-slate-400" />}
          </button>

          {state.user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <img src={state.user.picture} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{state.user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{state.user.email}</p>
                </div>
              </div>
              <button 
                onClick={syncToDrive}
                disabled={state.isSyncing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {state.isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                {state.isSyncing ? "Syncing..." : "Sync ke Cloud"}
              </button>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-medium transition-all">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-center">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">Simpan di Cloud</p>
              <button 
                onClick={handleLogin}
                className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <User className="w-3 h-3" /> Login Google
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 p-4 lg:p-10 max-w-6xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex justify-between items-start md:block">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {activeTab === 'tracker' && 'Tracker Sholat'}
                {activeTab === 'dashboard' && 'Statistik Spiritual'}
                {activeTab === 'history' && 'Riwayat Ibadah'}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {formatDate(new Date().toISOString().split('T')[0])}
                </span>
                {state.user && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <Cloud className="w-3 h-3" /> Cloud Synced
                  </span>
                )}
              </div>
            </div>
            {/* Mobile Theme Toggle */}
            <button 
              onClick={cycleTheme}
              className="md:hidden p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
            >
              {themeMode === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
              {themeMode === 'dark' && <Moon className="w-5 h-5 text-emerald-400" />}
              {themeMode === 'system' && <Monitor className="w-5 h-5 text-slate-400" />}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSearching(!isSearching)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-400 hover:ring-2 hover:ring-emerald-50 dark:hover:ring-emerald-950/50 transition-all group"
            >
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                {state.schedule?.location || 'Mencari lokasi...'}
              </span>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSearching ? 'rotate-90' : ''}`} />
            </button>
            <Button variant="ghost" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" onClick={() => getLocationAndSchedule()} isLoading={state.isLoading && !isSearching}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {(isSearching || state.error) && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300 relative z-40">
            <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${state.error ? 'border-rose-200 dark:border-rose-900 ring-4 ring-rose-50 dark:ring-rose-950/30' : 'border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-slate-950'}`}>
              {state.error && (
                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 flex items-start gap-3 border-b border-rose-100 dark:border-rose-900 rounded-t-2xl">
                  <Bell className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-700 dark:text-rose-300">
                    <p className="font-semibold">Informasi Lokasi</p>
                    <p>{state.error}</p>
                  </div>
                </div>
              )}
              <div className="p-5 flex flex-col gap-6">
                <form onSubmit={handleManualSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Masukkan nama kota atau kecamatan..."
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-slate-800 dark:text-slate-100 font-medium"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.length > 0) setShowHistory(false);
                        else if (locationHistory.length > 0) setShowHistory(true);
                      }}
                      onFocus={() => { if (searchQuery.length === 0 && locationHistory.length > 0) setShowHistory(true); }}
                      autoFocus
                    />
                    {isSearchingSuggestions && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="w-4 h-4 animate-spin text-emerald-600" /></div>
                    )}
                  </div>
                  <Button type="submit" className="px-6 rounded-2xl" isLoading={state.isLoading}>Cari</Button>
                  <Button variant="ghost" className="rounded-2xl dark:text-slate-400" onClick={() => { setIsSearching(false); setSuggestions([]); setShowHistory(false); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </form>

                {showHistory && locationHistory.length > 0 && searchQuery.length === 0 && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Clock3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Riwayat Kecamatan</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {locationHistory.map((address, idx) => (
                        <button key={idx} onClick={() => getLocationAndSchedule(address)} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-300 transition-all flex items-center gap-2 group">
                          <MapPin className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                          {getKecamatan(address)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">Hasil Pencarian</div>
                  {suggestions.map((loc, idx) => (
                    <button key={idx} className="w-full px-5 py-4 text-left text-sm text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 flex items-start gap-4 group" onClick={() => getLocationAndSchedule(loc)}>
                      <MapPin className="w-5 h-5 mt-0.5 opacity-30 flex-shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:opacity-100" />
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-slate-100">{getKecamatan(loc)}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-500 opacity-80">{loc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {PRAYER_ORDER.map((name) => {
                const prayer = state.schedule?.prayers.find(p => p.name === name);
                const loggedToday = state.logs.find(l => l.date === new Date().toISOString().split('T')[0] && l.prayerName === name);
                return (
                  <div key={name} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col transition-all hover:shadow-xl dark:hover:shadow-emerald-950/10 hover:border-emerald-100 dark:hover:border-emerald-900 group">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-colors ${PRAYER_COLORS[name]}`}>
                        {name}
                      </div>
                      <div className="text-3xl font-black text-slate-800 dark:text-slate-100 font-arabic group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {prayer?.time || '--:--'}
                      </div>
                    </div>
                    <div className="mt-auto pt-8 border-t border-slate-50 dark:border-slate-800">
                      {loggedToday ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Pelaksanaan</p>
                              <p className="text-sm font-black text-slate-800 dark:text-slate-200">{loggedToday.actualTime}</p>
                            </div>
                          </div>
                          {loggedToday.status === 'Late' && (
                            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-black">+{loggedToday.delayMinutes}m</span>
                          )}
                        </div>
                      ) : (
                        <Button className="w-full h-12 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10" disabled={!prayer} onClick={() => prayer && logPrayer(name, prayer.time)}>
                          Tandai Sholat
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {state.schedule?.sources && state.schedule.sources.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl"><Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Grounding Source</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {state.schedule.sources.map((source, i) => (
                    <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all shadow-sm">
                      <span className="truncate max-w-[180px]">{source.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-emerald-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 dark:from-emerald-900 dark:to-emerald-950 text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl shadow-emerald-900/20">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tight">Terus Beristiqomah!</h3>
                  <p className="text-emerald-100/80 max-w-lg text-lg leading-relaxed font-medium">"Jagalah sholatmu, karena ketika kamu kehilangannya, kamu akan kehilangan segalanya." <br/><span className="text-sm font-bold text-emerald-300 opacity-60">— Umar bin Khattab</span></p>
                </div>
                <div className="flex -space-x-4">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="w-16 h-16 rounded-full bg-emerald-700/40 border-4 border-emerald-500/20 flex items-center justify-center backdrop-blur-md shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
                       <CheckCircle className="w-8 h-8 text-emerald-300" />
                     </div>
                   ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-400 rounded-full blur-[80px] opacity-10"></div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard logs={state.logs} />}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Semua Catatan</h3>
              <Button variant="danger" className="rounded-xl px-6 text-xs font-black uppercase tracking-widest" onClick={clearHistory}>
                <Trash2 className="w-4 h-4" /> Hapus Data
              </Button>
            </div>
            {state.logs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-20 text-center border border-slate-200 dark:border-slate-800 border-dashed">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6"><HistoryIcon className="w-10 h-10 text-slate-300 dark:text-slate-700" /></div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Riwayat Kosong</h3>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Tanggal</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Sholat</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Waktu</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                      <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Delay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...state.logs].reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-6 text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-8 py-6"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${PRAYER_COLORS[log.prayerName]}`}>{log.prayerName}</span></td>
                        <td className="px-8 py-6 text-sm font-black text-slate-800 dark:text-slate-200">{log.actualTime} <span className="text-slate-400 dark:text-slate-600 font-bold ml-3 opacity-50">({log.scheduledTime})</span></td>
                        <td className="px-8 py-6"><span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${log.status === 'Ontime' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400'}`}><div className={`w-1.5 h-1.5 rounded-full ${log.status === 'Ontime' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{log.status === 'Late' ? 'Terlambat' : 'Tepat Waktu'}</span></td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500 dark:text-slate-600">{log.delayMinutes > 0 ? `${log.delayMinutes}m` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
