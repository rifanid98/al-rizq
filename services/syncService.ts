import { PrayerLog, AppSettings } from '../types';
import { STORAGE_KEYS } from '../constants';
import { supabase } from './supabaseClient';

/**
 * Upload local data to Supabase
 * We wrap both logs and settings into the existing 'logs' column 
 * since adding a new column 'settings' might require manual DB migration.
 */
export const uploadToCloud = async (email: string, logs: PrayerLog[], settings?: AppSettings): Promise<number> => {
    const timestamp = Date.now();

    const { error } = await supabase
        .from('user_backups')
        .upsert({
            email: email,
            logs: { logs, settings }, // Wrap into the existing 'logs' column
            last_updated: timestamp
        }, { onConflict: 'email' });

    if (error) {
        console.error('Supabase Upload Error:', error);
        throw new Error('Gagal mengunggah data ke cloud.');
    }

    return timestamp;
};

/**
 * Download data from Supabase for a specific user
 */
export const downloadFromCloud = async (email: string): Promise<{ logs: PrayerLog[], settings?: AppSettings, last_updated: number } | null> => {
    const { data, error } = await supabase
        .from('user_backups')
        .select('logs, last_updated')
        .eq('email', email)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        console.error('Supabase Download Error:', error);
        throw new Error('Gagal mengunduh data dari cloud.');
    }

    // Backward compatibility check
    let logs: PrayerLog[] = [];
    let settings: AppSettings | undefined = undefined;

    if (Array.isArray(data.logs)) {
        // Old format: logs is just an array
        logs = data.logs;
    } else if (data.logs && typeof data.logs === 'object') {
        // New format: logs is { logs, settings }
        logs = data.logs.logs || [];
        settings = data.logs.settings;
    }

    return {
        logs,
        settings,
        last_updated: data.last_updated
    };
};

export const shouldAutoSync = (): boolean => {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;

    const msPerHour = 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > msPerHour;
};
