
import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../../../shared/constants';
import { AppSettings } from '../../../shared/types';

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

    const [locationHistory, setLocationHistory] = useState<string[]>(() => {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.LOCATION_HISTORY);
        return savedHistory ? JSON.parse(savedHistory) : [];
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
        restoreSettings
    };
};
