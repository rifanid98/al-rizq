
import { useState, useEffect, useCallback } from 'react';
import { DailyHabitLog } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { getLocalDateStr } from '../../../shared/utils/helpers';
import { DAILY_HABITS } from '../data/sunnahContent';

export const useDailyHabit = () => {
    const [logs, setLogs] = useState<DailyHabitLog[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.DAILY_HABIT_LOGS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse daily habit logs", e);
            return [];
        }
    });

    useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEYS.DAILY_HABIT_LOGS);
            setLogs(saved ? JSON.parse(saved) : []);
        };
        window.addEventListener('daily_habit_logs_updated', handleUpdate);
        window.addEventListener('app_data_reset', handleUpdate);
        return () => {
            window.removeEventListener('daily_habit_logs_updated', handleUpdate);
            window.removeEventListener('app_data_reset', handleUpdate);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.DAILY_HABIT_LOGS, JSON.stringify(logs));
    }, [logs]);

    const getHabits = useCallback(() => {
        return DAILY_HABITS;
    }, []);

    const getHabit = useCallback((id: string) => {
        return DAILY_HABITS.find(h => h.id === id);
    }, []);

    const getLog = useCallback((date: string, habitId: string) => {
        return logs.find(l => l.date === date && l.habitId === habitId);
    }, [logs]);

    const getLogsForDate = useCallback((date: string) => {
        return logs.filter(l => l.date === date);
    }, [logs]);

    const toggleHabit = useCallback((habitId: string, value: number | boolean = true, date: string = getLocalDateStr()) => {
        setLogs(prev => {
            const existingLog = prev.find(l => l.date === date && l.habitId === habitId);
            const habit = DAILY_HABITS.find(h => h.id === habitId);

            if (!habit) return prev;

            // For checkbox type, toggle behavior
            if (habit.type === 'checkbox' && existingLog && existingLog.value === true) {
                return prev.filter(l => l.id !== existingLog.id);
            }

            const newLog: DailyHabitLog = {
                id: existingLog?.id || crypto.randomUUID(),
                date,
                habitId,
                value,
                timestamp: Date.now()
            };

            return existingLog
                ? prev.map(l => l.id === existingLog.id ? newLog : l)
                : [...prev, newLog];
        });

        // Dispatch event to notify other components
        setTimeout(() => {
            window.dispatchEvent(new Event('daily_habit_logs_updated'));
        }, 0);
    }, []);

    const updateValue = useCallback((habitId: string, value: number, date: string = getLocalDateStr()) => {
        setLogs(prev => {
            const existingLog = prev.find(l => l.date === date && l.habitId === habitId);

            if (!existingLog) {
                // Create new log with the value
                const newLog: DailyHabitLog = {
                    id: crypto.randomUUID(),
                    date,
                    habitId,
                    value,
                    timestamp: Date.now()
                };
                return [...prev, newLog];
            }

            return prev.map(l =>
                l.id === existingLog.id
                    ? { ...l, value, timestamp: Date.now() }
                    : l
            );
        });

        // Dispatch event to notify other components
        setTimeout(() => {
            window.dispatchEvent(new Event('daily_habit_logs_updated'));
        }, 0);
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
        localStorage.removeItem(STORAGE_KEYS.DAILY_HABIT_LOGS);
        window.dispatchEvent(new Event('daily_habit_logs_updated'));
    }, []);

    return {
        logs,
        getHabits,
        getHabit,
        getLog,
        getLogsForDate,
        toggleHabit,
        updateValue,
        clearLogs
    };
};
