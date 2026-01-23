
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
            status?: PrayerLog['status'],
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
        const nowTime = new Date().toTimeString().slice(0, 5);
        const dateToUse = options.selectedDate || today;
        const nowTimestamp = Date.now();
        const targetId = options.extra?.id || options.editingLogId;

        setLogs(prev => {
            const updateIdx = targetId ? prev.findIndex(l => l.id === targetId) : -1;
            const existingDailyIdx = prev.findIndex(l => l.date === dateToUse && l.prayerName === prayerName && !targetId);

            const targetIdx = updateIdx !== -1 ? updateIdx : existingDailyIdx;
            const existingLog = targetIdx !== -1 ? prev[targetIdx] : null;

            // Determine actual time: keep old if editing, use provided extra, or use current time
            const actualTimeToUse = existingLog ? existingLog.actualTime : (options.extra?.actualTime || nowTime);
            const delayToUse = calculateDelay(scheduledTime, actualTimeToUse);

            // Use provided status, or calculate based on isForgot/isLate
            let statusToUse: PrayerLog['status'] = options.status || 'Tepat Waktu';
            if (!options.status) {
                if (!options.isForgot && isLate(scheduledTime, actualTimeToUse)) {
                    statusToUse = 'Terlambat';
                }
            }

            const prefix = '(Lupa menandai)';
            const rawReason = options.reason || '';
            // Clean reason by removing the prefix if it exists to avoid duplication
            const cleanReason = rawReason.replace(prefix, '').trim();

            const logData: PrayerLog = {
                id: (targetId || crypto.randomUUID()),
                date: existingLog ? existingLog.date : (options.extra?.date || dateToUse),
                prayerName,
                scheduledTime,
                actualTime: actualTimeToUse,
                status: statusToUse,
                delayMinutes: delayToUse,
                reason: options.isForgot
                    ? (cleanReason ? `${prefix} ${cleanReason}` : prefix)
                    : (cleanReason || undefined),
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

            localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, nowTimestamp.toString());
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
