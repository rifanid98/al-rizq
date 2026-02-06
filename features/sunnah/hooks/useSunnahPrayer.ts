
import { useState, useEffect, useCallback } from 'react';
import { SunnahPrayerLog } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { getLocalDateStr } from '../../../shared/utils/helpers';
import { SUNNAH_PRAYERS } from '../data/sunnahContent';

export const useSunnahPrayer = () => {
    const [logs, setLogs] = useState<SunnahPrayerLog[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SUNNAH_PRAYER_LOGS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse sunnah prayer logs", e);
            return [];
        }
    });

    useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEYS.SUNNAH_PRAYER_LOGS);
            setLogs(saved ? JSON.parse(saved) : []);
        };
        window.addEventListener('sunnah_prayer_logs_updated', handleUpdate);
        window.addEventListener('app_data_reset', handleUpdate);
        return () => {
            window.removeEventListener('sunnah_prayer_logs_updated', handleUpdate);
            window.removeEventListener('app_data_reset', handleUpdate);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.SUNNAH_PRAYER_LOGS, JSON.stringify(logs));
    }, [logs]);

    const getPrayers = useCallback(() => {
        return SUNNAH_PRAYERS;
    }, []);

    const getPrayer = useCallback((id: string) => {
        return SUNNAH_PRAYERS.find(p => p.id === id);
    }, []);

    const getLog = useCallback((date: string, prayerId: string) => {
        return logs.find(l => l.date === date && l.prayerId === prayerId);
    }, [logs]);

    const getLogsForDate = useCallback((date: string) => {
        return logs.filter(l => l.date === date);
    }, [logs]);

    const togglePrayer = useCallback((prayerId: string, rakaat: number = 2, date: string = getLocalDateStr()) => {
        setLogs(prev => {
            const existingLog = prev.find(l => l.date === date && l.prayerId === prayerId);

            if (existingLog && existingLog.isCompleted) {
                // Toggle off - remove the log
                return prev.filter(l => l.id !== existingLog.id);
            }

            // Create new log or update to completed
            const newLog: SunnahPrayerLog = {
                id: existingLog?.id || crypto.randomUUID(),
                date,
                prayerId,
                rakaat,
                isCompleted: true,
                timestamp: Date.now()
            };

            return existingLog
                ? prev.map(l => l.id === existingLog.id ? newLog : l)
                : [...prev, newLog];
        });

        // Dispatch event to notify other components
        setTimeout(() => {
            window.dispatchEvent(new Event('sunnah_prayer_logs_updated'));
        }, 0);
    }, []);

    const updateRakaat = useCallback((prayerId: string, rakaat: number, date: string = getLocalDateStr()) => {
        setLogs(prev => {
            const existingLog = prev.find(l => l.date === date && l.prayerId === prayerId);
            if (!existingLog) return prev;

            return prev.map(l =>
                l.id === existingLog.id
                    ? { ...l, rakaat, timestamp: Date.now() }
                    : l
            );
        });

        // Dispatch event to notify other components
        setTimeout(() => {
            window.dispatchEvent(new Event('sunnah_prayer_logs_updated'));
        }, 0);
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
        localStorage.removeItem(STORAGE_KEYS.SUNNAH_PRAYER_LOGS);
        window.dispatchEvent(new Event('sunnah_prayer_logs_updated'));
    }, []);

    return {
        logs,
        getPrayers,
        getPrayer,
        getLog,
        getLogsForDate,
        togglePrayer,
        updateRakaat,
        clearLogs
    };
};
