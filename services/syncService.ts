
import { PrayerLog } from '../types';
import { STORAGE_KEYS } from '../constants';

// Simulated Cloud Storage using localStorage under a different key
const CLOUD_STORAGE_KEY = 'al_rizq_cloud_mock_storage';

interface CloudData {
    logs: PrayerLog[];
    lastUpdated: number;
}

export const syncWithCloud = async (localLogs: PrayerLog[], localLastUpdated: number): Promise<{ logs: PrayerLog[], lastUpdated: number, action: 'pulled' | 'pushed' | 'none' }> => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 1000));

    const remoteRaw = localStorage.getItem(CLOUD_STORAGE_KEY);
    const remoteData: CloudData | null = remoteRaw ? JSON.parse(remoteRaw) : null;

    if (!remoteData) {
        // No remote data, push local
        const newData = { logs: localLogs, lastUpdated: localLastUpdated };
        localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(newData));
        return { ...newData, action: 'pushed' };
    }

    if (localLastUpdated > remoteData.lastUpdated) {
        // Local is newer, push local
        const newData = { logs: localLogs, lastUpdated: localLastUpdated };
        localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(newData));
        return { ...newData, action: 'pushed' };
    } else if (remoteData.lastUpdated > localLastUpdated) {
        // Remote is newer, pull remote
        return { ...remoteData, action: 'pulled' };
    }

    return { logs: localLogs, lastUpdated: localLastUpdated, action: 'none' };
};

export const shouldAutoSync = (): boolean => {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;

    const msPerDay = 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > msPerDay;
};
