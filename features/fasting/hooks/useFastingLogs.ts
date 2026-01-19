
import { useState, useCallback, useEffect, useMemo } from 'react';
import { FastingLog, FastingType } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { getHijriDate, isSeninKamis, isAyyamulBidh } from '../services/fastingService';

export const useFastingLogs = () => {
    // Signal for re-reading from localStorage
    const [refreshSignal, setRefreshSignal] = useState(0);

    const FASTING_LOGS_UPDATED = 'fasting_logs_updated';

    const getStoredLogs = useCallback((): FastingLog[] => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.FASTING_LOGS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse fasting logs", e);
            return [];
        }
    }, []);

    // Memoized logs that update whenever refreshSignal changes
    const fastingLogs = useMemo(() => getStoredLogs(), [refreshSignal, getStoredLogs]);

    // Listen for updates from other components
    useEffect(() => {
        const handleUpdate = () => setRefreshSignal(prev => prev + 1);
        window.addEventListener(FASTING_LOGS_UPDATED, handleUpdate);
        return () => window.removeEventListener(FASTING_LOGS_UPDATED, handleUpdate);
    }, []);

    const logFasting = useCallback((date: string, type: FastingType, isCompleted: boolean = true, isNadzar: boolean = false) => {
        const currentLogs = getStoredLogs();
        // Remove existing log for this date if any
        const filtered = currentLogs.filter(l => l.date !== date);
        const newLog: FastingLog = {
            id: crypto.randomUUID(),
            date,
            type,
            isCompleted,
            isNadzar
        };
        const updatedLogs = [...filtered, newLog];

        localStorage.setItem(STORAGE_KEYS.FASTING_LOGS, JSON.stringify(updatedLogs));
        window.dispatchEvent(new Event(FASTING_LOGS_UPDATED));
    }, [getStoredLogs]);

    const removeFastingLog = useCallback((date: string) => {
        const currentLogs = getStoredLogs();
        const updatedLogs = currentLogs.filter(l => l.date !== date);

        localStorage.setItem(STORAGE_KEYS.FASTING_LOGS, JSON.stringify(updatedLogs));
        window.dispatchEvent(new Event(FASTING_LOGS_UPDATED));
    }, [getStoredLogs]);

    const clearFastingLogs = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.FASTING_LOGS);
        window.dispatchEvent(new Event(FASTING_LOGS_UPDATED));
    }, []);

    const getLogForDate = useCallback((date: string) => {
        return fastingLogs.find(l => l.date === date);
    }, [fastingLogs]);

    const getLogStats = useCallback(() => {
        let nadzar = 0;
        let qadha = 0;
        let sunnah = 0;
        let wajib = 0; // Ramadhan

        fastingLogs.forEach(l => {
            // Nadzar Count
            if (l.type === 'Nadzar' || l.isNadzar) {
                nadzar++;
            }

            // Qadha Count
            if (l.type === 'Qadha') {
                qadha++;
            }

            // Ramadhan (Wajib) Count
            if (l.type === 'Ramadhan') {
                wajib++;
            }

            // Sunnah Count
            const isExplicitSunnah = ['Senin-Kamis', 'Ayyamul Bidh', 'Lainnya'].includes(l.type);

            // Check if implicit sunnah (e.g. type is Nadzar but day is Sunnah)
            let isImplicitSunnah = false;
            if (l.type === 'Nadzar') {
                const date = new Date(l.date);
                const hijri = getHijriDate(date);
                if (isSeninKamis(date) || isAyyamulBidh(hijri)) {
                    isImplicitSunnah = true;
                }
            }

            if (isExplicitSunnah || isImplicitSunnah) {
                sunnah++;
            }
        });

        return {
            total: fastingLogs.length,
            nadzar,
            qadha,
            sunnah,
            wajib
        };
    }, [fastingLogs]);

    // No need to export setFastingLogs as it is managed internally via actions
    return {
        fastingLogs,
        logFasting,
        removeFastingLog,
        clearFastingLogs,
        getLogForDate,
        getLogStats
    };
};
