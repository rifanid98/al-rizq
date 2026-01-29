
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { STORAGE_KEYS } from '../../../shared/constants';
import { AppSettings, Language, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useSettings = () => {
    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem('al_rizq_theme') as ThemeMode) || 'system';
    });

    const [showPrayerBg, setShowPrayerBg] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('al_rizq_show_bg');
            return saved !== null ? JSON.parse(saved) : true;
        } catch (e) {
            return true;
        }
    });

    const [prayerBgOpacity, setPrayerBgOpacity] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('al_rizq_bg_opacity');
            return saved !== null ? JSON.parse(saved) : 10;
        } catch (e) {
            return 10;
        }
    });

    const [prayerTimeCorrection, setPrayerTimeCorrection] = useState<Required<AppSettings['prayerTimeCorrection']>>(() => {
        try {
            const saved = localStorage.getItem('al_rizq_prayer_correction');
            return saved ? JSON.parse(saved) : { global: 0, fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
        } catch (e) {
            return { global: 0, fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
        }
    });

    const [locationHistory, setLocationHistory] = useState<string[]>(() => {
        try {
            const savedHistory = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (e) {
            return [];
        }
    });

    const [lastKnownLocation, setLastKnownLocation] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEYS.LAST_KNOWN_LOCATION) || '';
    });

    const [gamificationConfig, setGamificationConfig] = useState<Required<AppSettings>['gamificationConfig']>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.GAMIFICATION_CONFIG);
            return saved ? JSON.parse(saved) : DEFAULT_GAMIFICATION_CONFIG;
        } catch (e) {
            return DEFAULT_GAMIFICATION_CONFIG;
        }
    });

    const [nadzarConfig, setNadzarConfig] = useState<any>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.NADZAR_CONFIG);
            return saved ? JSON.parse(saved) : undefined;
        } catch (e) {
            return undefined;
        }
    });

    const [qadhaConfig, setQadhaConfig] = useState<any>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.QADHA_CONFIG);
            return saved ? JSON.parse(saved) : undefined;
        } catch (e) {
            return undefined;
        }
    });

    const [ramadhanConfig, setRamadhanConfig] = useState<AppSettings['ramadhanConfig']>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.RAMADHAN_CONFIG);
            return saved ? JSON.parse(saved) : undefined;
        } catch (e) {
            return undefined;
        }
    });

    const { language, setLanguage } = useLanguage();

    useEffect(() => {
        const handleRamadhanUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEYS.RAMADHAN_CONFIG);
            if (saved) setRamadhanConfig(JSON.parse(saved));
        };
        const handleQadhaUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEYS.QADHA_CONFIG);
            if (saved) setQadhaConfig(JSON.parse(saved));
        };
        const handleNadzarUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEYS.NADZAR_CONFIG);
            if (saved) setNadzarConfig(JSON.parse(saved));
        }

        window.addEventListener('ramadhan_config_updated', handleRamadhanUpdate);
        window.addEventListener('qadha_config_updated', handleQadhaUpdate);
        window.addEventListener('nadzar_config_updated', handleNadzarUpdate);
        return () => {
            window.removeEventListener('ramadhan_config_updated', handleRamadhanUpdate);
            window.removeEventListener('qadha_config_updated', handleQadhaUpdate);
            window.removeEventListener('nadzar_config_updated', handleNadzarUpdate);
        };
    }, []);



    useEffect(() => {
        localStorage.setItem('al_rizq_show_bg', JSON.stringify(showPrayerBg));
    }, [showPrayerBg]);

    useEffect(() => {
        localStorage.setItem('al_rizq_bg_opacity', JSON.stringify(prayerBgOpacity));
    }, [prayerBgOpacity]);

    useEffect(() => {
        localStorage.setItem('al_rizq_prayer_correction', JSON.stringify(prayerTimeCorrection));
    }, [prayerTimeCorrection]);

    useEffect(() => {
        if (lastKnownLocation) {
            localStorage.setItem(STORAGE_KEYS.LAST_KNOWN_LOCATION, lastKnownLocation);
        }
    }, [lastKnownLocation]);

    useEffect(() => {
        if (gamificationConfig) {
            localStorage.setItem(STORAGE_KEYS.GAMIFICATION_CONFIG, JSON.stringify(gamificationConfig));
        }
    }, [gamificationConfig]);

    useEffect(() => {
        const handleReset = () => {
            setThemeMode('system');
            setShowPrayerBg(true);
            setPrayerBgOpacity(10);
            setPrayerTimeCorrection({ global: 0, fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
            setLocationHistory([]);
            setLastKnownLocation('');
            setGamificationConfig(DEFAULT_GAMIFICATION_CONFIG);
            setRamadhanConfig(undefined);
            setQadhaConfig(undefined);
            setNadzarConfig(undefined);
            setLanguage('id'); // Default language
        };
        window.addEventListener('app_data_reset', handleReset);
        return () => window.removeEventListener('app_data_reset', handleReset);
    }, [setLanguage]);

    const addToHistory = useCallback((address: string) => {
        setLocationHistory(prev => {
            const updated = [address, ...prev.filter(a => a !== address)].slice(0, 10);
            localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeHistory = useCallback((address: string) => {
        setLocationHistory(prev => {
            const updated = prev.filter(a => a !== address);
            localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const cycleTheme = useCallback(() => {
        setThemeMode(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light');
    }, []);

    const getCurrentSettings = useCallback((): AppSettings => {
        const nadzar = localStorage.getItem(STORAGE_KEYS.NADZAR_CONFIG);
        const qadha = localStorage.getItem(STORAGE_KEYS.QADHA_CONFIG);
        const ramadhan = localStorage.getItem(STORAGE_KEYS.RAMADHAN_CONFIG);
        return {
            theme: themeMode,
            locationHistory: locationHistory,
            showPrayerBg: showPrayerBg,
            prayerBgOpacity: prayerBgOpacity,
            language: language,
            nadzarConfig: nadzar ? JSON.parse(nadzar) : undefined,
            qadhaConfig: qadha ? JSON.parse(qadha) : undefined,
            ramadhanConfig: ramadhan ? JSON.parse(ramadhan) : undefined,
            prayerTimeCorrection: prayerTimeCorrection,
            lastKnownLocation: lastKnownLocation,
            gamificationConfig: gamificationConfig
        };
    }, [themeMode, locationHistory, showPrayerBg, prayerBgOpacity, language, prayerTimeCorrection, lastKnownLocation, gamificationConfig, nadzarConfig, qadhaConfig, ramadhanConfig]);

    const restoreSettings = useCallback((s: AppSettings) => {
        if (s.theme) setThemeMode(s.theme);
        if (s.locationHistory) setLocationHistory(s.locationHistory);
        if (s.showPrayerBg !== undefined) setShowPrayerBg(s.showPrayerBg);
        if (s.prayerBgOpacity !== undefined) setPrayerBgOpacity(s.prayerBgOpacity);
        if (s.prayerTimeCorrection) setPrayerTimeCorrection(s.prayerTimeCorrection as any);
        if (s.lastKnownLocation) setLastKnownLocation(s.lastKnownLocation);
        if (s.gamificationConfig) setGamificationConfig(s.gamificationConfig);

        if (s.nadzarConfig) {
            localStorage.setItem(STORAGE_KEYS.NADZAR_CONFIG, JSON.stringify(s.nadzarConfig));
            window.dispatchEvent(new Event('nadzar_config_updated'));
        }
        if (s.qadhaConfig) {
            localStorage.setItem(STORAGE_KEYS.QADHA_CONFIG, JSON.stringify(s.qadhaConfig));
            window.dispatchEvent(new Event('qadha_config_updated'));
        }
        if (s.ramadhanConfig) {
            localStorage.setItem(STORAGE_KEYS.RAMADHAN_CONFIG, JSON.stringify(s.ramadhanConfig));
            window.dispatchEvent(new Event('ramadhan_config_updated'));
        }

        if (s.language) {
            const normalized = (s.language.startsWith('id') ? 'id' : s.language.startsWith('en') ? 'en' : 'id') as Language;
            setLanguage(normalized);
            localStorage.setItem('al_rizq_language', normalized);
        }

        // Also update localStorage for immediate persistence
        if (s.theme) localStorage.setItem('al_rizq_theme', s.theme);
        if (s.locationHistory) localStorage.setItem(STORAGE_KEYS.LOCATION_HISTORY, JSON.stringify(s.locationHistory));
        if (s.showPrayerBg !== undefined) localStorage.setItem('al_rizq_show_bg', JSON.stringify(s.showPrayerBg));
        if (s.prayerBgOpacity !== undefined) localStorage.setItem('al_rizq_bg_opacity', JSON.stringify(s.prayerBgOpacity));
        if (s.prayerTimeCorrection) localStorage.setItem('al_rizq_prayer_correction', JSON.stringify(s.prayerTimeCorrection));
        if (s.lastKnownLocation) localStorage.setItem(STORAGE_KEYS.LAST_KNOWN_LOCATION, s.lastKnownLocation);
        if (s.gamificationConfig) localStorage.setItem(STORAGE_KEYS.GAMIFICATION_CONFIG, JSON.stringify(s.gamificationConfig));
    }, []);

    const [isResolvedDark, setIsResolvedDark] = useState<boolean>(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return themeMode === 'dark' || (themeMode === 'system' && mediaQuery.matches);
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateTheme = () => {
            const isDark = themeMode === 'dark' || (themeMode === 'system' && mediaQuery.matches);
            setIsResolvedDark(isDark);
            document.documentElement.classList.toggle('dark', isDark);
        };

        updateTheme();
        localStorage.setItem('al_rizq_theme', themeMode);

        mediaQuery.addEventListener('change', updateTheme);
        return () => mediaQuery.removeEventListener('change', updateTheme);
    }, [themeMode]);

    return {
        themeMode,
        setThemeMode,
        isDark: isResolvedDark,
        showPrayerBg,
        setShowPrayerBg,
        prayerBgOpacity,
        setPrayerBgOpacity,
        locationHistory,
        setLocationHistory,
        addToHistory,
        cycleTheme,
        getCurrentSettings,
        restoreSettings,
        language,
        setLanguage,
        prayerTimeCorrection,
        setPrayerTimeCorrection,
        lastKnownLocation,
        setLastKnownLocation,
        removeHistory,
        gamificationConfig,
        setGamificationConfig,
        ramadhanConfig,
        qadhaConfig,
        nadzarConfig,
        setNadzarConfig
    };
};
