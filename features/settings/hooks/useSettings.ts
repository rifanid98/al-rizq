
import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../../../shared/constants';
import { AppSettings, Language } from '../../../shared/types';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useSettings = () => {
    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem('al_rizq_theme') as ThemeMode) || 'system';
    });

    const [showPrayerBg, setShowPrayerBg] = useState<boolean>(() => {
        const saved = localStorage.getItem('al_rizq_show_bg');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [prayerBgOpacity, setPrayerBgOpacity] = useState<number>(() => {
        const saved = localStorage.getItem('al_rizq_bg_opacity');
        return saved !== null ? JSON.parse(saved) : 10;
    });

    const [prayerTimeCorrection, setPrayerTimeCorrection] = useState<Required<AppSettings['prayerTimeCorrection']>>(() => {
        const saved = localStorage.getItem('al_rizq_prayer_correction');
        return saved ? JSON.parse(saved) : { global: 0, fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    });

    const [locationHistory, setLocationHistory] = useState<string[]>(() => {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
        return savedHistory ? JSON.parse(savedHistory) : [];
    });

    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('al_rizq_language');
        if (saved === 'id' || saved === 'en') return saved;
        if (saved?.startsWith('id')) return 'id';
        if (saved?.startsWith('en')) return 'en';
        return 'id';
    });

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
        localStorage.setItem('al_rizq_language', language);
    }, [language]);

    const addToHistory = useCallback((address: string) => {
        setLocationHistory(prev => {
            const updated = [address, ...prev.filter(a => a !== address)].slice(0, 10);
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
        return {
            theme: themeMode,
            locationHistory: locationHistory,
            showPrayerBg: showPrayerBg,
            prayerBgOpacity: prayerBgOpacity,
            language: language,
            nadzarConfig: nadzar ? JSON.parse(nadzar) : undefined,
            qadhaConfig: qadha ? JSON.parse(qadha) : undefined,
            prayerTimeCorrection: prayerTimeCorrection
        };
    }, [themeMode, locationHistory, showPrayerBg, prayerBgOpacity, language, prayerTimeCorrection]);

    const restoreSettings = useCallback((s: AppSettings) => {
        if (s.theme) setThemeMode(s.theme);
        if (s.locationHistory) setLocationHistory(s.locationHistory);
        if (s.showPrayerBg !== undefined) setShowPrayerBg(s.showPrayerBg);
        if (s.prayerBgOpacity !== undefined) setPrayerBgOpacity(s.prayerBgOpacity);
        if (s.prayerTimeCorrection) setPrayerTimeCorrection(s.prayerTimeCorrection as any);

        if (s.nadzarConfig) {
            localStorage.setItem(STORAGE_KEYS.NADZAR_CONFIG, JSON.stringify(s.nadzarConfig));
            window.dispatchEvent(new Event('fasting_config_updated'));
        }
        if (s.qadhaConfig) {
            localStorage.setItem(STORAGE_KEYS.QADHA_CONFIG, JSON.stringify(s.qadhaConfig));
            window.dispatchEvent(new Event('fasting_config_updated'));
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
    }, []);

    return {
        themeMode,
        setThemeMode,
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
        setPrayerTimeCorrection
    };
};
