import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FastingLog, FastingType, FastingPreferenceConfig } from '../../../shared/types/index';
import { STORAGE_KEYS } from '../../../shared/constants';

interface FastingState {
    logs: FastingLog[];
    nadzarConfig: FastingPreferenceConfig;
    qadhaConfig: FastingPreferenceConfig;
    ramadhanConfig: { startDate: string; endDate: string };

    // Actions
    addLog: (log: FastingLog) => void;
    removeLog: (date: string) => void;
    clearLogs: () => void;

    setNadzarConfig: (config: FastingPreferenceConfig) => void;
    setQadhaConfig: (config: FastingPreferenceConfig) => void;
    setRamadhanConfig: (config: { startDate: string; endDate: string }) => void;
    setLogs: (logs: FastingLog[]) => void;
}

export const useFastingStore = create<FastingState>()(
    persist(
        (set) => ({
            logs: [],
            nadzarConfig: { types: [], days: [], customDates: [] },
            qadhaConfig: { types: [], days: [], customDates: [] },
            ramadhanConfig: { startDate: '', endDate: '' },

            addLog: (log) => set((state) => {
                // Remove existing log for date if exists to avoid duplicates
                const filtered = state.logs.filter((l) => l.date !== log.date);
                return { logs: [...filtered, log] };
            }),

            removeLog: (date) => set((state) => ({
                logs: state.logs.filter((l) => l.date !== date),
            })),

            clearLogs: () => set({ logs: [] }),

            setNadzarConfig: (config) => {
                set({ nadzarConfig: config });
                localStorage.setItem(STORAGE_KEYS.NADZAR_CONFIG, JSON.stringify(config));
                window.dispatchEvent(new Event('nadzar_config_updated'));
            },
            setQadhaConfig: (config) => {
                set({ qadhaConfig: config });
                localStorage.setItem(STORAGE_KEYS.QADHA_CONFIG, JSON.stringify(config));
                window.dispatchEvent(new Event('qadha_config_updated'));
            },
            setRamadhanConfig: (config) => {
                set({ ramadhanConfig: config });
                localStorage.setItem(STORAGE_KEYS.RAMADHAN_CONFIG, JSON.stringify(config));
                window.dispatchEvent(new Event('ramadhan_config_updated'));
            },
            setLogs: (logs) => set({ logs }),
        }),
        {
            name: 'fasting-storage', // name of item in the storage (must be unique)
            partialize: (state) => ({
                logs: state.logs,
                nadzarConfig: state.nadzarConfig,
                qadhaConfig: state.qadhaConfig,
                ramadhanConfig: state.ramadhanConfig
            }),
            // We need to support migration from old separate keys if possible, 
            // but for now we are replacing the storage mechanism. 
            // Ideally we would read from old keys on hydrate if new storage is empty.
        }
    )
);
