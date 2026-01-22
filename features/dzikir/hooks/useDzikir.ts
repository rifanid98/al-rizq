
import { useState, useEffect, useCallback } from 'react';
import { DzikirLog, DzikirCategory } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { getLocalDateStr } from '../../../shared/utils/helpers';
import { DZIKIR_CATEGORIES } from '../data/dzikirContent';

export const useDzikir = () => {
    const [logs, setLogs] = useState<DzikirLog[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.DZIKIR_LOGS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse dzikir logs", e);
            return [];
        }
    });

    useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEYS.DZIKIR_LOGS);
            setLogs(saved ? JSON.parse(saved) : []);
        };
        window.addEventListener('dzikir_logs_updated', handleUpdate);
        return () => window.removeEventListener('dzikir_logs_updated', handleUpdate);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.DZIKIR_LOGS, JSON.stringify(logs));
    }, [logs]);

    const getCategories = useCallback(() => {
        return DZIKIR_CATEGORIES;
    }, []);

    const getCategory = useCallback((id: string) => {
        return DZIKIR_CATEGORIES.find(c => c.id === id);
    }, []);

    // Helper to suggest default category based on time
    const getSuggestedCategory = useCallback((): string => {
        const hour = new Date().getHours();
        // 00:00 - 14:59 -> Pagi
        // 15:00 - 23:59 -> Petang
        return hour >= 15 ? 'petang' : 'pagi';
    }, []);

    const getLog = useCallback((date: string, categoryId: string) => {
        return logs.find(l => l.date === date && l.categoryId === categoryId);
    }, [logs]);

    const toggleItem = useCallback((itemId: string, categoryId: string, date: string = getLocalDateStr()) => {
        setLogs(prev => {
            const existingLog = prev.find(l => l.date === date && l.categoryId === categoryId);
            const category = DZIKIR_CATEGORIES.find(c => c.id === categoryId);

            if (!category) return prev;

            let completedItems = existingLog ? [...existingLog.completedItems] : [];

            if (completedItems.includes(itemId)) {
                completedItems = completedItems.filter(i => i !== itemId);
            } else {
                completedItems.push(itemId);
            }

            const isCompleted = category.items.every(item => completedItems.includes(item.id));

            const newLog: DzikirLog = {
                id: existingLog?.id || crypto.randomUUID(),
                date,
                categoryId,
                completedItems,
                isCompleted,
                timestamp: Date.now()
            };

            const updatedLogs = existingLog
                ? prev.map(l => l.id === existingLog.id ? newLog : l)
                : [...prev, newLog];

            // Manually trigger storage update and event to ensure other hook instances see it
            localStorage.setItem(STORAGE_KEYS.DZIKIR_LOGS, JSON.stringify(updatedLogs));
            window.dispatchEvent(new Event('dzikir_logs_updated'));

            return updatedLogs;
        });
    }, []);

    return {
        logs,
        getCategories,
        getCategory,
        getSuggestedCategory,
        getLog,
        toggleItem
    };
};
