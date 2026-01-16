import { PrayerLog, AppSettings } from '../types';
import { STORAGE_KEYS } from '../constants';
import { supabase } from './supabaseClient';

/**
 * Upload local data to Supabase
 */
export const uploadToCloud = async (email: string, logs: PrayerLog[], settings?: AppSettings): Promise<number> => {
    const timestamp = Date.now();

    const { error } = await supabase
        .from('user_backups')
        .upsert({
            email: email,
            logs: logs,
            settings: settings,
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
        .select('logs, settings, last_updated')
        .eq('email', email)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        console.error('Supabase Download Error:', error);
        throw new Error('Gagal mengunduh data dari cloud.');
    }

    return {
        logs: data.logs,
        settings: data.settings,
        last_updated: data.last_updated
    };
};

export const shouldAutoSync = (): boolean => {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;

    const msPerHour = 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > msPerHour;
};
