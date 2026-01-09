
import { PrayerLog } from '../types';
import { STORAGE_KEYS } from '../constants';

// SIMULASI CLOUD STORAGE (Dapat diganti dengan Firebase/Supabase nanti)
const REMOTE_CLOUD_STORAGE_KEY = 'al_rizq_simulated_remote_db';

interface SyncPackage {
    logs: PrayerLog[];
    lastUpdated: number;
}

/**
 * Push local data to "Cloud"
 */
export const uploadToCloud = async (logs: PrayerLog[]): Promise<number> => {
    // Simulasi Delay Network
    await new Promise(res => setTimeout(res, 1000));

    const timestamp = Date.now();
    const data: SyncPackage = { logs, lastUpdated: timestamp };

    localStorage.setItem(REMOTE_CLOUD_STORAGE_KEY, JSON.stringify(data));
    return timestamp;
};

/**
 * Pull data from "Cloud" to replace local
 */
export const downloadFromCloud = async (): Promise<SyncPackage | null> => {
    // Simulasi Delay Network
    await new Promise(res => setTimeout(res, 1000));

    const remoteRaw = localStorage.getItem(REMOTE_CLOUD_STORAGE_KEY);
    if (!remoteRaw) return null;

    return JSON.parse(remoteRaw);
};

export const shouldAutoSync = (): boolean => {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;

    const msPerHour = 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > msPerHour;
};
