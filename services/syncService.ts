
import { PrayerLog } from '../types';
import { STORAGE_KEYS } from '../constants';

// SIMULASI CLOUD STORAGE (Dapat diganti dengan Firebase/Supabase nanti)
// Untuk simulasi antar tab/window, kita gunakan key yang berbeda di localStorage
const REMOTE_CLOUD_STORAGE_KEY = 'al_rizq_simulated_remote_db';

interface SyncPackage {
    logs: PrayerLog[];
    lastUpdated: number;
}

export const syncHistoryWithCloud = async (localLogs: PrayerLog[], localLastUpdated: number): Promise<{
    logs: PrayerLog[],
    lastUpdated: number,
    status: 'synced_to_cloud' | 'synced_from_cloud' | 'up_to_date'
}> => {
    // Simulasi Delay Network
    await new Promise(res => setTimeout(res, 800));

    const remoteRaw = localStorage.getItem(REMOTE_CLOUD_STORAGE_KEY);
    const remoteData: SyncPackage | null = remoteRaw ? JSON.parse(remoteRaw) : null;

    // JIKA CLOUD KOSONG: Push data lokal ke cloud
    if (!remoteData) {
        const newData = { logs: localLogs, lastUpdated: localLastUpdated };
        localStorage.setItem(REMOTE_CLOUD_STORAGE_KEY, JSON.stringify(newData));
        return { ...newData, status: 'synced_to_cloud' };
    }

    // LOGIKA PERBANDINGAN:
    if (localLastUpdated > remoteData.lastUpdated) {
        // Data lokal lebih baru -> Update Cloud
        const newData = { logs: localLogs, lastUpdated: localLastUpdated };
        localStorage.setItem(REMOTE_CLOUD_STORAGE_KEY, JSON.stringify(newData));
        return { ...newData, status: 'synced_to_cloud' };
    } else if (remoteData.lastUpdated > localLastUpdated) {
        // Data cloud lebih baru -> Update Lokal (Replace)
        return { ...remoteData, status: 'synced_from_cloud' };
    }

    return { logs: localLogs, lastUpdated: localLastUpdated, status: 'up_to_date' };
};

export const shouldAutoSync = (): boolean => {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;

    const msPerHour = 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > msPerHour; // Cek tiap jam untuk auto-sync
};
