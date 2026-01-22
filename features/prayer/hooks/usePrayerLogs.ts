
import { useState, useEffect, useCallback } from 'react';
import { PrayerLog, PrayerName } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { getLocalDateStr, calculateDelay, isLate } from '../../../shared/utils/helpers';

export const usePrayerLogs = () => {
    const [logs, setLogs] = useState<PrayerLog[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse prayer logs", e);
            return [];
        }
    });

    useEffect(() => {
        const handleReset = () => setLogs([]);
        window.addEventListener('prayer_logs_reset', handleReset);
        window.addEventListener('app_data_reset', handleReset);
        return () => {
            window.removeEventListener('prayer_logs_reset', handleReset);
            window.removeEventListener('app_data_reset', handleReset);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    }, [logs]);

    const logPrayer = useCallback((
        prayerName: PrayerName,
        scheduledTime: string,
        options: {
            reason?: string,
            isForgot?: boolean,
            extra?: Partial<PrayerLog>,
            isMasbuq?: boolean,
            masbuqRakaat?: number,
            locationType?: 'Rumah' | 'Masjid',
            executionType?: 'Jamaah' | 'Munfarid',
            weatherCondition?: 'Cerah' | 'Hujan',
            hasDzikir?: boolean,
            hasQobliyah?: boolean,
            hasBadiyah?: boolean,
            hasDua?: boolean,
            editingLogId?: string | null,
            selectedDate?: string
        }
    ) => {
        const today = getLocalDateStr();
        const actualTime = new Date().toTimeString().slice(0, 5);
        const delay = calculateDelay(scheduledTime, actualTime);
        const dateToUse = options.selectedDate || today;

        let status: PrayerLog['status'] = 'Tepat Waktu';
        if (!options.isForgot && isLate(scheduledTime, actualTime)) {
            status = 'Terlambat';
        }

        const now = Date.now();
        const targetId = options.extra?.id || options.editingLogId;

        setLogs(prev => {
            const updateIdx = targetId ? prev.findIndex(l => l.id === targetId) : -1;
            const existingDailyIdx = prev.findIndex(l => l.date === dateToUse && l.prayerName === prayerName && !targetId);

            const targetIdx = updateIdx !== -1 ? updateIdx : existingDailyIdx;
            const existingLog = targetIdx !== -1 ? prev[targetIdx] : null;

            const logData: PrayerLog = {
                id: (targetId || crypto.randomUUID()),
                date: existingLog ? existingLog.date : (options.extra?.date || dateToUse),
                prayerName,
                scheduledTime,
                actualTime: existingLog ? existingLog.actualTime : (options.extra?.actualTime || actualTime),
                status: existingLog ? existingLog.status : status,
                delayMinutes: existingLog ? existingLog.delayMinutes : delay,
                reason: options.isForgot ? (options.reason ? `(Lupa menandai) ${options.reason}` : 'Lupa menandai') : (options.reason || undefined),
                isMasbuq: options.isMasbuq || false,
                masbuqRakaat: options.isMasbuq ? options.masbuqRakaat : undefined,
                locationType: options.locationType || 'Masjid',
                executionType: options.executionType || 'Jamaah',
                weatherCondition: options.weatherCondition || 'Cerah',
                hasDzikir: options.hasDzikir || false,
                hasQobliyah: options.hasQobliyah || false,
                hasBadiyah: options.hasBadiyah || false,
                hasDua: options.hasDua || false,
                ...options.extra
            };

            const newLogs = [...prev];
            if (targetIdx !== -1) {
                newLogs[targetIdx] = logData;
            } else {
                newLogs.push(logData);
            }

            localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, now.toString());
            return newLogs;
        });
    }, []);

    const deleteLog = useCallback((id: string) => {
        setLogs(prev => prev.filter(l => l.id !== id));
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
        localStorage.removeItem(STORAGE_KEYS.LOGS);
    }, []);

    return { logs, setLogs, logPrayer, deleteLog, clearLogs };
};
