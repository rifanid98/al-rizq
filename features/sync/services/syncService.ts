import { PrayerLog, AppSettings, FastingLog, DzikirLog } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { supabase } from '../../../shared/services/supabaseClient';

// ============================================
// Helper: Get or Create User
// ============================================
const getOrCreateUserId = async (email: string, name?: string, picture?: string): Promise<string> => {
    // Try to get existing user
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existingUser) return existingUser.id;

    const { data: newUser, error } = await supabase
        .from('users')
        .insert({ email, name, picture })
        .select('id')
        .maybeSingle();

    if (error) throw new Error('Failed to create user: ' + error.message);
    if (!newUser) throw new Error('Failed to create user: No data returned');
    return newUser.id;
};

// ============================================
// Upload Functions
// ============================================

const uploadPrayerLogs = async (userId: string, logs: PrayerLog[]) => {
    if (!logs.length) return;

    const records = logs.map(log => ({
        id: log.id,
        user_id: userId,
        date: log.date,
        prayer_name: log.prayerName,
        scheduled_time: log.scheduledTime,
        actual_time: log.actualTime,
        status: log.status,
        delay_minutes: log.delayMinutes || 0,
        reason: log.reason,
        is_masbuq: log.isMasbuq || false,
        masbuq_rakaat: log.masbuqRakaat,
        location_type: log.locationType,
        execution_type: log.executionType,
        weather_condition: log.weatherCondition,
        has_dzikir: log.hasDzikir || false,
        has_qobliyah: log.hasQobliyah || false,
        has_badiyah: log.hasBadiyah || false,
        has_dua: log.hasDua || false
    }));

    const { error } = await supabase
        .from('prayer_logs')
        .upsert(records, { onConflict: 'user_id,date,prayer_name' });

    if (error) console.error('Upload prayer_logs error:', error);
};

const uploadFastingLogs = async (userId: string, logs: FastingLog[]) => {
    if (!logs.length) return;

    const records = logs.map(log => ({
        id: log.id,
        user_id: userId,
        date: log.date,
        type: log.type,
        is_completed: log.isCompleted,
        notes: log.notes,
        is_nadzar: log.isNadzar || false,
        is_qadha: log.isQadha || false
    }));

    const { error } = await supabase
        .from('fasting_logs')
        .upsert(records, { onConflict: 'user_id,date' });

    if (error) console.error('Upload fasting_logs error:', error);
};

const uploadDzikirLogs = async (userId: string, logs: DzikirLog[]) => {
    if (!logs.length) return;

    const records = logs.map(log => ({
        id: log.id,
        user_id: userId,
        date: log.date,
        category_id: log.categoryId,
        completed_items: log.completedItems,
        is_completed: log.isCompleted,
        timestamp: log.timestamp
    }));

    const { error } = await supabase
        .from('dzikir_logs')
        .upsert(records, { onConflict: 'user_id,date,category_id' });

    if (error) console.error('Upload dzikir_logs error:', error);
};

const uploadBadges = async (userId: string, badges: any[]) => {
    if (!badges.length) return;

    const records = badges.map(badge => ({
        user_id: userId,
        badge_id: badge.badgeId,
        current_count: badge.currentCount || 0,
        unlocked_tier: badge.unlockedTier,
        is_new: badge.isNew || false,
        unlocked_at: badge.unlockedAt ? new Date(badge.unlockedAt).toISOString() : null
    }));

    const { error } = await supabase
        .from('user_badges')
        .upsert(records, { onConflict: 'user_id,badge_id' });

    if (error) console.error('Upload user_badges error:', error);
};

const uploadSettings = async (userId: string, settings: AppSettings) => {
    if (!settings) return;

    const record = {
        user_id: userId,
        theme: settings.theme || 'system',
        language: settings.language || 'id',
        show_prayer_bg: settings.showPrayerBg ?? true,
        prayer_bg_opacity: settings.prayerBgOpacity ?? 0.5,
        location_history: settings.locationHistory || [],
        last_known_location: settings.lastKnownLocation,
        correction_global: settings.prayerTimeCorrection?.global || 0,
        correction_fajr: settings.prayerTimeCorrection?.fajr || 0,
        correction_dhuhr: settings.prayerTimeCorrection?.dhuhr || 0,
        correction_asr: settings.prayerTimeCorrection?.asr || 0,
        correction_maghrib: settings.prayerTimeCorrection?.maghrib || 0,
        correction_isha: settings.prayerTimeCorrection?.isha || 0,
        gamification_enabled: settings.gamificationConfig?.enabled ?? true,
        gamification_points: settings.gamificationConfig?.points
    };

    const { error } = await supabase
        .from('user_settings')
        .upsert(record, { onConflict: 'user_id' });

    if (error) console.error('Upload user_settings error:', error);

    // Upload fasting configs separately
    if (settings.nadzarConfig) {
        console.log('Uploading nadzarConfig:', settings.nadzarConfig);
        const { error: nadzarError } = await supabase.from('fasting_configs').upsert({
            user_id: userId,
            config_type: 'nadzar',
            types: settings.nadzarConfig.types || [],
            days: settings.nadzarConfig.days || [],
            custom_dates: settings.nadzarConfig.customDates || [],
            start_date: settings.nadzarConfig.startDate || null,
            end_date: settings.nadzarConfig.endDate || null
        }, { onConflict: 'user_id,config_type' });
        if (nadzarError) console.error('Upload nadzar fasting_configs error:', nadzarError);
    }

    if (settings.qadhaConfig) {
        console.log('Uploading qadhaConfig:', settings.qadhaConfig);
        const { error: qadhaError } = await supabase.from('fasting_configs').upsert({
            user_id: userId,
            config_type: 'qadha',
            types: settings.qadhaConfig.types || [],
            days: settings.qadhaConfig.days || [],
            custom_dates: settings.qadhaConfig.customDates || [],
            start_date: settings.qadhaConfig.startDate || null,
            end_date: settings.qadhaConfig.endDate || null
        }, { onConflict: 'user_id,config_type' });
        if (qadhaError) console.error('Upload qadha fasting_configs error:', qadhaError);
    }

    if (settings.ramadhanConfig) {
        console.log('Uploading ramadhanConfig:', settings.ramadhanConfig);
        const { error: ramadhanError } = await supabase.from('fasting_configs').upsert({
            user_id: userId,
            config_type: 'ramadhan',
            start_date: settings.ramadhanConfig.startDate || null,
            end_date: settings.ramadhanConfig.endDate || null
        }, { onConflict: 'user_id,config_type' });
        if (ramadhanError) console.error('Upload ramadhan fasting_configs error:', ramadhanError);
    }

};

// ============================================
// Main Upload Function
// ============================================
export const uploadToCloud = async (
    email: string,
    logs: PrayerLog[],
    settings: AppSettings,
    fastingLogs: FastingLog[],
    dzikirLogs: DzikirLog[],
    badges: any[]
): Promise<number> => {
    const timestamp = Date.now();

    try {
        // Get or create user
        const userId = await getOrCreateUserId(email);

        // Upload all data in parallel
        await Promise.all([
            uploadPrayerLogs(userId, logs),
            uploadFastingLogs(userId, fastingLogs),
            uploadDzikirLogs(userId, dzikirLogs),
            uploadBadges(userId, badges),
            uploadSettings(userId, settings)
        ]);

        // Also update legacy table for backward compatibility
        await supabase
            .from('user_backups')
            .upsert({
                email: email,
                logs: { logs, settings, fastingLogs, dzikirLogs, badges },
                last_updated: timestamp
            }, { onConflict: 'email' });

        return timestamp;
    } catch (error) {
        console.error('Supabase Upload Error:', error);
        throw new Error('Gagal mengunggah data ke cloud.');
    }
};

// ============================================
// Download Functions
// ============================================

const downloadPrayerLogs = async (userId: string): Promise<PrayerLog[]> => {
    const { data, error } = await supabase
        .from('prayer_logs')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Download prayer_logs error:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        prayerName: row.prayer_name,
        scheduledTime: row.scheduled_time,
        actualTime: row.actual_time,
        status: row.status,
        delayMinutes: row.delay_minutes,
        reason: row.reason,
        isMasbuq: row.is_masbuq,
        masbuqRakaat: row.masbuq_rakaat,
        locationType: row.location_type,
        executionType: row.execution_type,
        weatherCondition: row.weather_condition,
        hasDzikir: row.has_dzikir,
        hasQobliyah: row.has_qobliyah,
        hasBadiyah: row.has_badiyah,
        hasDua: row.has_dua
    }));
};

const downloadFastingLogs = async (userId: string): Promise<FastingLog[]> => {
    const { data, error } = await supabase
        .from('fasting_logs')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Download fasting_logs error:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        type: row.type,
        isCompleted: row.is_completed,
        notes: row.notes,
        isNadzar: row.is_nadzar,
        isQadha: row.is_qadha
    }));
};

const downloadDzikirLogs = async (userId: string): Promise<DzikirLog[]> => {
    const { data, error } = await supabase
        .from('dzikir_logs')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Download dzikir_logs error:', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        date: row.date,
        categoryId: row.category_id,
        completedItems: row.completed_items || [],
        isCompleted: row.is_completed,
        timestamp: row.timestamp
    }));
};

const downloadBadges = async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Download user_badges error:', error);
        return [];
    }

    return (data || []).map(row => ({
        badgeId: row.badge_id,
        currentCount: row.current_count,
        unlockedTier: row.unlocked_tier,
        isNew: row.is_new,
        unlockedAt: row.unlocked_at ? new Date(row.unlocked_at).getTime() : undefined
    }));
};

const downloadSettings = async (userId: string): Promise<AppSettings> => {
    const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    const { data: configsData } = await supabase
        .from('fasting_configs')
        .select('*')
        .eq('user_id', userId);

    const settings: AppSettings = {
        theme: settingsData?.theme || 'system',
        language: settingsData?.language || 'id',
        showPrayerBg: settingsData?.show_prayer_bg ?? true,
        prayerBgOpacity: settingsData?.prayer_bg_opacity ?? 0.5,
        locationHistory: settingsData?.location_history || [],
        lastKnownLocation: settingsData?.last_known_location,
        prayerTimeCorrection: {
            global: settingsData?.correction_global || 0,
            fajr: settingsData?.correction_fajr || 0,
            dhuhr: settingsData?.correction_dhuhr || 0,
            asr: settingsData?.correction_asr || 0,
            maghrib: settingsData?.correction_maghrib || 0,
            isha: settingsData?.correction_isha || 0
        },
        gamificationConfig: {
            enabled: settingsData?.gamification_enabled ?? true,
            points: settingsData?.gamification_points
        }
    };

    // Map fasting configs
    if (configsData) {
        for (const config of configsData) {
            if (config.config_type === 'nadzar') {
                settings.nadzarConfig = {
                    types: config.types || [],
                    days: config.days || [],
                    customDates: config.custom_dates || [],
                    startDate: config.start_date,
                    endDate: config.end_date
                };
            } else if (config.config_type === 'qadha') {
                settings.qadhaConfig = {
                    types: config.types || [],
                    days: config.days || [],
                    customDates: config.custom_dates || [],
                    startDate: config.start_date,
                    endDate: config.end_date
                };
            } else if (config.config_type === 'ramadhan') {
                settings.ramadhanConfig = {
                    startDate: config.start_date,
                    endDate: config.end_date
                };
            }
        }
    }

    return settings;
};

// ============================================
// Main Download Function
// ============================================
export const downloadFromCloud = async (email: string): Promise<{
    logs: PrayerLog[],
    settings: AppSettings,
    fastingLogs: FastingLog[],
    dzikirLogs: DzikirLog[],
    badges: any[],
    last_updated: number
} | null> => {
    try {
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (!user) {
            // Fallback to legacy table
            return downloadFromCloudLegacy(email);
        }

        const userId = user.id;

        // Download all data in parallel
        const [logs, fastingLogs, dzikirLogs, badges, settings] = await Promise.all([
            downloadPrayerLogs(userId),
            downloadFastingLogs(userId),
            downloadDzikirLogs(userId),
            downloadBadges(userId),
            downloadSettings(userId)
        ]);

        return {
            logs,
            settings,
            fastingLogs,
            dzikirLogs,
            badges,
            last_updated: Date.now()
        };
    } catch (error) {
        console.error('Download error, falling back to legacy:', error);
        return downloadFromCloudLegacy(email);
    }
};

// Fallback to old format for backward compatibility
const downloadFromCloudLegacy = async (email: string): Promise<{
    logs: PrayerLog[],
    settings: AppSettings,
    fastingLogs: FastingLog[],
    dzikirLogs: DzikirLog[],
    badges: any[],
    last_updated: number
} | null> => {
    const { data, error } = await supabase
        .from('user_backups')
        .select('logs, last_updated')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Supabase Download Error:', error);
        throw new Error('Gagal mengunduh data dari cloud.');
    }

    if (!data) return null;

    let logs: PrayerLog[] = [];
    let settings: any = {};
    let fastingLogs: FastingLog[] = [];
    let dzikirLogs: DzikirLog[] = [];
    let badges: any[] = [];

    if (Array.isArray(data.logs)) {
        logs = data.logs;
    } else if (data.logs && typeof data.logs === 'object') {
        logs = data.logs.logs || [];
        settings = data.logs.settings || {};
        fastingLogs = data.logs.fastingLogs || [];
        dzikirLogs = data.logs.dzikirLogs || [];
        badges = data.logs.badges || [];
    }

    return {
        logs,
        settings,
        fastingLogs,
        dzikirLogs,
        badges,
        last_updated: data.last_updated
    };
};

export const shouldAutoSync = (): boolean => {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;

    const msPerHour = 60 * 60 * 1000;
    return Date.now() - parseInt(lastSync) > msPerHour;
};

// ============================================
// Delete Functions
// ============================================

export const deleteCloudData = async (email: string): Promise<void> => {
    // 1. Delete from legacy backup table
    await supabase
        .from('user_backups')
        .delete()
        .eq('email', email);

    // 2. Delete from new schema (cascades logs, settings, etc.)
    await supabase
        .from('users')
        .delete()
        .eq('email', email);
};
