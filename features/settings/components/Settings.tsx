
import React from 'react';
import {
    User,
    Cloud,
    CloudUpload,
    CloudDownload,
    RotateCcw,
    Moon,
    Sun,
    Monitor,
    Image as ImageIcon,
    ChevronRight,
    LogOut,
    Settings as SettingsIcon,
    ShieldCheck,
    Globe,
    Bell,
    Trash2,
    Loader2,
    LayoutGrid,
    Lock,
    Unlock
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { GamificationSettings } from '../../gamification/components/GamificationSettings';
import { UserBadge } from '../../../shared/types/gamification';
import { PrayerLog, AppSettings, UserProfile, FastingLog, GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';
import { STORAGE_KEYS, CURRENT_VERSION } from '../../../shared/constants';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { useFastingStore } from '../../fasting/stores/useFastingStore';

interface SettingsProps {
    user: UserProfile | null;
    logs: PrayerLog[];
    fastingLogs: FastingLog[];
    dzikirLogs: any[];
    isSyncing: boolean;
    hasBackup: boolean;
    themeMode: 'light' | 'dark' | 'system';
    showPrayerBg: boolean;
    prayerBgOpacity: number;
    onUpload: (logs: PrayerLog[], settings: AppSettings, fastingLogs: FastingLog[], dzikirLogs: any[]) => Promise<void>;
    onDownload: () => Promise<any>;
    onRevert: (logs: PrayerLog[]) => Promise<any>;
    onDeleteCloudData: () => Promise<void>;
    onLogout: () => void;
    onCycleTheme: () => void;
    onToggleBg: () => void;
    onOpacityChange: (val: number) => void;
    prayerTimeCorrection: Required<AppSettings['prayerTimeCorrection']>;
    onCorrectionChange: (newCorrection: Required<AppSettings['prayerTimeCorrection']>) => void;
    getCurrentSettings: () => AppSettings;
    setLogs: (logs: PrayerLog[]) => void;
    restoreSettings: (s: AppSettings) => void;
    googleBtnRef: React.RefObject<HTMLDivElement | null>;
    onClearData: () => void;
    gamificationConfig?: GamificationConfig;
    gamification?: {
        level: number;
        progress: number;
        totalPoints: number;
        nextThreshold: number;
        currentPoints: number;
        currentLevelThreshold: number;
        pointsInLevel: number;
        pointsNeededForLevel: number;
        config: GamificationConfig;
        badges: UserBadge[];
    };
    onGamificationConfigChange?: (config: GamificationConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    user,
    logs,
    fastingLogs,
    dzikirLogs,
    isSyncing,
    hasBackup,
    themeMode,
    showPrayerBg,
    prayerBgOpacity,
    onUpload,
    onDownload,
    onRevert,
    onDeleteCloudData,
    onLogout,
    onCycleTheme,
    onToggleBg,
    onOpacityChange,
    prayerTimeCorrection,
    onCorrectionChange,
    getCurrentSettings,
    setLogs,
    restoreSettings,
    googleBtnRef,
    onClearData,
    gamificationConfig,
    gamification,
    onGamificationConfigChange
}) => {
    const { t, language, setLanguage } = useLanguage();
    const [showIndividualCorrection, setShowIndividualCorrection] = React.useState(false);
    const [isCorrectionEditingEnabled, setIsCorrectionEditingEnabled] = React.useState(false);

    return (
        <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">


            {/* Profile Section */}
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    {user ? (
                        <>
                            <div className="relative">
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    referrerPolicy="no-referrer"
                                    className="w-24 h-24 rounded-3xl border-4 border-slate-50 dark:border-slate-800 shadow-xl object-cover"
                                />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{user.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-900/50">
                                        {t.common.premiumAccount}
                                    </span>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {t.common.version} {CURRENT_VERSION}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={onLogout}
                                className="rounded-2xl border border-rose-100 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-6"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                {t.common.logout}
                            </Button>
                        </>
                    ) : (
                        <div className="w-full flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center shrink-0">
                                <User className="w-10 h-10 text-slate-400" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{t.common.notLoggedIn}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.common.loginPrompt}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div ref={googleBtnRef} className="rounded-full shadow-md overflow-hidden transform hover:scale-105 active:scale-95 transition-all flex items-center justify-center bg-white"></div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gamification Settings Section */}
                <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:col-span-2">
                    <GamificationSettings
                        config={gamificationConfig || DEFAULT_GAMIFICATION_CONFIG}
                        onChange={onGamificationConfigChange || (() => { })}
                    />
                </section>

                {/* Sync Section */}
                <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Cloud className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">{t.settings.sync.title}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.settings.sync.subtitle}</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{t.settings.sync.lastSync}</p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                                {(() => {
                                    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
                                    if (!lastSync) return t.settings.sync.never;
                                    const ts = parseInt(lastSync);
                                    if (isNaN(ts)) return t.settings.sync.never;
                                    return new Date(ts).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
                                })()}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                variant="ghost"
                                disabled={!user || isSyncing}
                                onClick={() => {
                                    const currentSettings = getCurrentSettings();
                                    const fStore = useFastingStore.getState();
                                    currentSettings.nadzarConfig = fStore.nadzarConfig;
                                    currentSettings.qadhaConfig = fStore.qadhaConfig;
                                    currentSettings.ramadhanConfig = fStore.ramadhanConfig;
                                    onUpload(logs, currentSettings, fastingLogs, dzikirLogs);
                                }}
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 sm:py-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-2 h-auto hover:border-emerald-500 transition-all group px-6 sm:px-4"
                            >
                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                                    {isSyncing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CloudUpload className="w-5 h-5" />
                                    )}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{t.settings.sync.upload}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                disabled={!user || isSyncing}
                                onClick={async () => {
                                    const result = await onDownload();
                                    if (result) {
                                        setLogs(result.logs);
                                        if (result.settings) {
                                            restoreSettings(result.settings);
                                            // Update Fasting Store Configs directly
                                            const store = useFastingStore.getState();
                                            if (result.settings.nadzarConfig) store.setNadzarConfig(result.settings.nadzarConfig);
                                            if (result.settings.qadhaConfig) store.setQadhaConfig(result.settings.qadhaConfig);
                                            if (result.settings.ramadhanConfig) store.setRamadhanConfig(result.settings.ramadhanConfig);
                                        }
                                        if (result.fastingLogs) {
                                            // Update Fasting Store Logs directly
                                            useFastingStore.getState().setLogs(result.fastingLogs);

                                            // Keep legacy storage update for now
                                            localStorage.setItem(STORAGE_KEYS.FASTING_LOGS, JSON.stringify(result.fastingLogs));
                                            window.dispatchEvent(new Event('fasting_logs_updated'));
                                        }
                                        if (result.dzikirLogs) {
                                            localStorage.setItem(STORAGE_KEYS.DZIKIR_LOGS, JSON.stringify(result.dzikirLogs));
                                            window.dispatchEvent(new Event('dzikir_logs_updated'));
                                        }
                                        if (result.badges) {
                                            localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(result.badges));
                                            window.dispatchEvent(new Event('gamification_updated'));
                                        }
                                        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(result.logs));
                                        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, result.last_updated.toString());
                                    }
                                }}
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 sm:py-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 sm:gap-2 h-auto hover:border-blue-500 transition-all group px-6 sm:px-4"
                            >
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                                    {isSyncing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CloudDownload className="w-5 h-5" />
                                    )}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{t.settings.sync.download}</span>
                            </Button>
                        </div>

                        {hasBackup && (
                            <Button
                                variant="ghost"
                                onClick={async () => {
                                    const result = await onRevert(logs);
                                    if (result) {
                                        if (result.logs) setLogs(result.logs);
                                        if (result.settings) restoreSettings(result.settings);
                                        if (result.fastingLogs) {
                                            localStorage.setItem(STORAGE_KEYS.FASTING_LOGS, JSON.stringify(result.fastingLogs));
                                            window.dispatchEvent(new Event('fasting_logs_updated'));
                                        }
                                        if (result.dzikirLogs) {
                                            localStorage.setItem(STORAGE_KEYS.DZIKIR_LOGS, JSON.stringify(result.dzikirLogs));
                                            window.dispatchEvent(new Event('dzikir_logs_updated'));
                                        }
                                        if (result.badges) {
                                            localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(result.badges));
                                            window.dispatchEvent(new Event('gamification_updated'));
                                        }
                                    }
                                }}
                                className="w-full rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 py-4 flex items-center justify-center gap-3 mt-2 hover:bg-rose-100 transition-all"
                            >
                                <RotateCcw className="w-5 h-5" />
                                <span className="text-xs font-black uppercase tracking-widest">{t.settings.sync.revert}</span>
                            </Button>
                        )}

                        {user && (
                            <Button
                                variant="ghost"
                                disabled={isSyncing}
                                onClick={onDeleteCloudData}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 py-3 flex items-center justify-center gap-2 mt-4 hover:text-rose-500 hover:border-rose-500 transition-all opacity-50 hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{language === 'id' ? 'Hapus Data Cloud' : 'Delete Cloud Data'}</span>
                            </Button>
                        )}
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center text-amber-600">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">{t.settings.appearance.title}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.settings.appearance.subtitle}</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                                    {themeMode === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
                                    {themeMode === 'dark' && <Moon className="w-5 h-5 text-emerald-400" />}
                                    {themeMode === 'system' && <Monitor className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{t.settings.appearance.theme}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.settings.themes[themeMode]}</p>
                                </div>
                            </div>
                            <button
                                onClick={onCycleTheme}
                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-600 hover:border-emerald-500 transition-all shadow-sm"
                            >
                                {t.settings.appearance.changeTheme}
                            </button>
                        </div>

                        {/* Background Settings */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                                        <ImageIcon className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{t.settings.appearance.background}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.settings.appearance.backgroundSubtitle}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onToggleBg}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showPrayerBg ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showPrayerBg ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {showPrayerBg && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.settings.appearance.opacity}</span>
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full">{prayerBgOpacity}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="40" step="5" value={prayerBgOpacity}
                                        onChange={(e) => onOpacityChange(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        <span>{t.settings.appearance.clear}</span>
                                        <span>{t.settings.appearance.overlay}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Prayer Time Correction Section */}
                <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center text-blue-600">
                            <img src="https://img.icons8.com/?size=100&id=10255&format=png&color=2563EB" className="w-6 h-6" alt="Clock" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">{t.settings.correction.title}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.settings.correction.description}</p>
                        </div>
                        <button
                            onClick={() => setIsCorrectionEditingEnabled(!isCorrectionEditingEnabled)}
                            className={`ml-auto p-2 rounded-xl transition-all ${isCorrectionEditingEnabled
                                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500'
                                }`}
                            title={isCorrectionEditingEnabled ? t.common?.lock || "Lock" : t.common?.unlock || "Unlock"}
                        >
                            {isCorrectionEditingEnabled ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Global Offset */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{t.settings.correction.global}</span>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                                    {prayerTimeCorrection.global > 0 ? '+' : ''}{prayerTimeCorrection.global} {t.settings.correction.minutes}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    disabled={!isCorrectionEditingEnabled}
                                    onClick={() => onCorrectionChange({ ...prayerTimeCorrection, global: Math.max(-30, prayerTimeCorrection.global - 1) })}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${!isCorrectionEditingEnabled ? 'bg-slate-50 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600 cursor-not-allowed' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >-</button>
                                <input
                                    type="range" min="-30" max="30" step="1"
                                    disabled={!isCorrectionEditingEnabled}
                                    value={prayerTimeCorrection.global}
                                    onChange={(e) => onCorrectionChange({ ...prayerTimeCorrection, global: parseInt(e.target.value) })}
                                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${!isCorrectionEditingEnabled ? 'bg-slate-100 dark:bg-slate-800 accent-slate-300' : 'bg-slate-200 dark:bg-slate-700 accent-blue-500'}`}
                                />
                                <button
                                    disabled={!isCorrectionEditingEnabled}
                                    onClick={() => onCorrectionChange({ ...prayerTimeCorrection, global: Math.min(30, prayerTimeCorrection.global + 1) })}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${!isCorrectionEditingEnabled ? 'bg-slate-50 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600 cursor-not-allowed' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >+</button>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-1">
                                <span>-30</span>
                                <span>0</span>
                                <span>+30</span>
                            </div>
                        </div>

                        {/* Individual Offsets (Accordion style) */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
                            <button
                                onClick={() => setShowIndividualCorrection(!showIndividualCorrection)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{t.settings.correction.individual}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {showIndividualCorrection ? t.common.hide : t.common.show}
                                    </span>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showIndividualCorrection ? 'rotate-90' : ''}`} />
                            </button>

                            {showIndividualCorrection && (
                                <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                        {(['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const).map((p) => (
                                            <div key={p} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{t.tracker.prayerNames[p === 'subuh' ? 'Subuh' : p === 'dzuhur' ? 'Dzuhur' : p === 'ashar' ? 'Ashar' : p === 'maghrib' ? 'Maghrib' : 'Isya']}</span>
                                                    <span className="text-[10px] text-slate-400">{prayerTimeCorrection[p === 'subuh' ? 'fajr' : p === 'isya' ? 'isha' : p] > 0 ? '+' : ''}{prayerTimeCorrection[p === 'subuh' ? 'fajr' : p === 'isya' ? 'isha' : p]} min</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        disabled={!isCorrectionEditingEnabled}
                                                        onClick={() => onCorrectionChange({ ...prayerTimeCorrection, [p === 'subuh' ? 'fajr' : p === 'isya' ? 'isha' : p]: (prayerTimeCorrection[p === 'subuh' ? 'fajr' : p === 'isya' ? 'isha' : p] as number) - 1 })}
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold ${!isCorrectionEditingEnabled ? 'bg-slate-50 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                                    >-</button>
                                                    <button
                                                        disabled={!isCorrectionEditingEnabled}
                                                        onClick={() => onCorrectionChange({ ...prayerTimeCorrection, [p === 'subuh' ? 'fajr' : p === 'isya' ? 'isha' : p]: (prayerTimeCorrection[p === 'subuh' ? 'fajr' : p === 'isya' ? 'isha' : p] as number) + 1 })}
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold ${!isCorrectionEditingEnabled ? 'bg-slate-50 text-slate-300 dark:bg-slate-800/50 dark:text-slate-600 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                                    >+</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Additional Links/Info */}
                <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">{t.settings.additional.title}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.settings.additional.subtitle}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div
                            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                            className="flex items-center gap-4 group cursor-pointer"
                        >
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-black text-slate-700 dark:text-slate-200">{t.settings.language.title}</p>
                                <p className="text-xs font-bold text-slate-400">{language === 'id' ? t.settings.language.id : t.settings.language.en}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">{t.common.change}</span>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-black text-slate-700 dark:text-slate-200">{t.settings.additional.notifications}</p>
                                <p className="text-xs font-bold text-slate-400">{t.settings.additional.notificationsSubtitle}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>

                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-black text-slate-700 dark:text-slate-200">{t.settings.additional.privacy}</p>
                                <p className="text-xs font-bold text-slate-400">{t.settings.additional.privacySubtitle}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </section>
            </div>


            {/* Danger Zone */}
            <section className="bg-rose-50 dark:bg-rose-950/10 rounded-[2.5rem] p-6 border border-rose-100 dark:border-rose-900/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-rose-700 dark:text-rose-400">{t.common.deleteAll}</h4>
                        <p className="text-xs font-bold text-rose-500/60 dark:text-rose-400/60 uppercase tracking-widest mt-0.5">
                            {language === 'id' ? 'Hapus semua catatan ibadah' : 'Delete all worship logs'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="danger"
                    onClick={() => { if (window.confirm(t.common.confirmDeleteAll)) onClearData(); }}
                    className="w-full md:w-auto rounded-xl px-6 py-3 shadow-lg shadow-rose-500/20"
                >
                    {t.common.deleteAll}
                </Button>
            </section>
        </div>
    );
};
