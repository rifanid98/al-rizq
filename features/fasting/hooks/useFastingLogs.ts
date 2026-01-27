
import { useCallback } from 'react';
import { FastingLog, FastingType } from '../../../shared/types';
import { getHijriDate, isSeninKamis, isAyyamulBidh } from '../services/fastingService';
import { useFastingStore } from '../stores/useFastingStore';

export const useFastingLogs = () => {
    const logs = useFastingStore((state) => state.logs);
    const addLog = useFastingStore((state) => state.addLog);
    const removeStoreLog = useFastingStore((state) => state.removeLog);
    const clearStoreLogs = useFastingStore((state) => state.clearLogs);

    const logFasting = useCallback((date: string, type: FastingType, isCompleted: boolean = true, isNadzar: boolean = false, isQadha: boolean = false) => {
        const newLog: FastingLog = {
            id: crypto.randomUUID(),
            date,
            type,
            isCompleted,
            isNadzar,
            isQadha
        };
        addLog(newLog);
    }, [addLog]);

    const removeFastingLog = useCallback((date: string) => {
        removeStoreLog(date);
    }, [removeStoreLog]);

    const clearFastingLogs = useCallback(() => {
        clearStoreLogs();
    }, [clearStoreLogs]);

    const getLogForDate = useCallback((date: string) => {
        return logs.find(l => l.date === date);
    }, [logs]);

    const getLogStats = useCallback(() => {
        let nadzar = 0;
        let qadha = 0;
        let sunnah = 0;
        let wajib = 0; // Ramadhan

        logs.forEach(l => {
            // Nadzar Count
            if (l.type === 'Nadzar' || l.isNadzar) {
                nadzar++;
            }

            // Qadha Count
            if (l.type === 'Qadha' || l.isQadha) {
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
            total: logs.length,
            nadzar,
            qadha,
            sunnah,
            wajib
        };
    }, [logs]);

    return {
        fastingLogs: logs,
        logFasting,
        removeFastingLog,
        clearFastingLogs,
        getLogForDate,
        getLogStats
    };
};
