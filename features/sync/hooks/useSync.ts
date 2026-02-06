import { useState, useCallback } from 'react';
import { PrayerLog, AppSettings, FastingLog, DzikirLog, SunnahPrayerLog, DailyHabitLog } from '../../../shared/types';
import { uploadToCloud, downloadFromCloud, deleteCloudData } from '../services/syncService';
import { STORAGE_KEYS } from '../../../shared/constants';

export const useSync = (userEmail: string | undefined) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasBackup, setHasBackup] = useState(!!localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP));
    const [backupSource, setBackupSource] = useState<'upload' | 'download' | null>(() => {
        return (localStorage.getItem('al_rizq_backup_source') as 'upload' | 'download') || null;
    });

    const handleUpload = useCallback(async (logs: PrayerLog[], settings: AppSettings, fastingLogs: FastingLog[], dzikirLogs: DzikirLog[], sunnahPrayerLogs: SunnahPrayerLog[], dailyHabitLogs: DailyHabitLog[]) => {
        if (!userEmail) return;
        setIsSyncing(true);
        try {
            const badgesStr = localStorage.getItem(STORAGE_KEYS.BADGES);
            const badges = badgesStr ? JSON.parse(badgesStr) : [];

            // Backup current cloud data before overwriting
            const result = await downloadFromCloud(userEmail);
            if (result) {
                if (result.logs) localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(result.logs));
                if (result.fastingLogs) localStorage.setItem('al_rizq_fasting_logs_backup', JSON.stringify(result.fastingLogs));
                if (result.dzikirLogs) localStorage.setItem('al_rizq_dzikir_logs_backup', JSON.stringify(result.dzikirLogs));
                if (result.settings) localStorage.setItem('al_rizq_settings_backup', JSON.stringify(result.settings));
                if (result.badges) localStorage.setItem('al_rizq_badges_backup', JSON.stringify(result.badges));
                if (result.sunnahPrayerLogs) localStorage.setItem('al_rizq_sunnah_prayer_logs_backup', JSON.stringify(result.sunnahPrayerLogs));
                if (result.dailyHabitLogs) localStorage.setItem('al_rizq_daily_habit_logs_backup', JSON.stringify(result.dailyHabitLogs));

                localStorage.setItem('al_rizq_backup_source', 'upload');
                setHasBackup(true);
                setBackupSource('upload');
            }

            const timestamp = await uploadToCloud(userEmail, logs, settings, fastingLogs, dzikirLogs, badges, sunnahPrayerLogs, dailyHabitLogs);
            localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, timestamp.toString());
            localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
        } catch (err) {
            console.error('Upload failed:', err);
            throw err;
        } finally {
            setIsSyncing(false);
        }
    }, [userEmail]);

    const handleDownload = useCallback(async (emailOverride?: string) => {
        const targetEmail = emailOverride || userEmail;
        if (!targetEmail) return;
        setIsSyncing(true);
        try {
            const result = await downloadFromCloud(targetEmail);
            if (result) {
                localStorage.setItem('al_rizq_backup_source', 'download');
                // Backup LOCAL state before applying download
                const currentLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
                if (currentLogs) localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, currentLogs);

                const currentFasting = localStorage.getItem(STORAGE_KEYS.FASTING_LOGS);
                if (currentFasting) localStorage.setItem('al_rizq_fasting_logs_backup', currentFasting);

                const currentDzikir = localStorage.getItem(STORAGE_KEYS.DZIKIR_LOGS);
                if (currentDzikir) localStorage.setItem('al_rizq_dzikir_logs_backup', currentDzikir);

                const currentBadges = localStorage.getItem(STORAGE_KEYS.BADGES);
                if (currentBadges) localStorage.setItem('al_rizq_badges_backup', currentBadges);

                const currentSunnahPrayer = localStorage.getItem(STORAGE_KEYS.SUNNAH_PRAYER_LOGS);
                if (currentSunnahPrayer) localStorage.setItem('al_rizq_sunnah_prayer_logs_backup', currentSunnahPrayer);

                const currentDailyHabit = localStorage.getItem(STORAGE_KEYS.DAILY_HABIT_LOGS);
                if (currentDailyHabit) localStorage.setItem('al_rizq_daily_habit_logs_backup', currentDailyHabit);

                setHasBackup(true);
                setBackupSource('download');
                return result;
            }
            return null;
        } catch (err) {
            console.error('Download failed:', err);
            throw err;
        } finally {
            setIsSyncing(false);
        }
    }, [userEmail]);

    const clearBackup = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.LOGS_BACKUP);
        localStorage.removeItem('al_rizq_fasting_logs_backup');
        localStorage.removeItem('al_rizq_dzikir_logs_backup');
        localStorage.removeItem('al_rizq_settings_backup');
        localStorage.removeItem('al_rizq_badges_backup');
        localStorage.removeItem('al_rizq_sunnah_prayer_logs_backup');
        localStorage.removeItem('al_rizq_daily_habit_logs_backup');
        localStorage.removeItem('al_rizq_backup_source');
        setHasBackup(false);
        setBackupSource(null);
    }, []);

    const handleRevert = useCallback(async (currentLogs: PrayerLog[]) => {
        const backupLogs = localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP);
        const backupFasting = localStorage.getItem('al_rizq_fasting_logs_backup');
        const backupDzikir = localStorage.getItem('al_rizq_dzikir_logs_backup');
        const backupSettings = localStorage.getItem('al_rizq_settings_backup');
        const backupBadges = localStorage.getItem('al_rizq_badges_backup');
        const backupSunnahPrayer = localStorage.getItem('al_rizq_sunnah_prayer_logs_backup');
        const backupDailyHabit = localStorage.getItem('al_rizq_daily_habit_logs_backup');
        const source = backupSource;

        if (!backupLogs) return null;

        const confirmMessage = source === 'upload'
            ? 'Membatalkan upload akan mengembalikan data cloud ke kondisi sebelum upload. Lanjutkan?'
            : 'Membatalkan download akan mengembalikan data lokal ke kondisi sebelum download. Lanjutkan?';

        if (window.confirm(confirmMessage)) {
            const restoredLogs = JSON.parse(backupLogs);
            const restoredFasting = backupFasting ? JSON.parse(backupFasting) : [];
            const restoredDzikir = backupDzikir ? JSON.parse(backupDzikir) : [];
            const restoredSettings = backupSettings ? JSON.parse(backupSettings) : undefined;
            const restoredBadges = backupBadges ? JSON.parse(backupBadges) : [];
            const restoredSunnahPrayer = backupSunnahPrayer ? JSON.parse(backupSunnahPrayer) : [];
            const restoredDailyHabit = backupDailyHabit ? JSON.parse(backupDailyHabit) : [];

            if (source === 'upload') {
                if (userEmail) {
                    setIsSyncing(true);
                    try {
                        await uploadToCloud(userEmail, restoredLogs, restoredSettings, restoredFasting, restoredDzikir, restoredBadges, restoredSunnahPrayer, restoredDailyHabit);
                        console.log('Cloud data restored successfully');
                    } catch (err) {
                        console.error('Failed to restore cloud data:', err);
                        alert('Gagal mengembalikan data cloud. Silakan coba lagi.');
                        throw err;
                    } finally {
                        setIsSyncing(false);
                    }
                }
                clearBackup();
                return null;
            } else {
                localStorage.setItem(STORAGE_KEYS.LOGS, backupLogs);
                if (backupFasting) {
                    localStorage.setItem(STORAGE_KEYS.FASTING_LOGS, backupFasting);
                    window.dispatchEvent(new Event('fasting_logs_updated'));
                }
                if (backupDzikir) {
                    localStorage.setItem(STORAGE_KEYS.DZIKIR_LOGS, backupDzikir);
                    window.dispatchEvent(new Event('dzikir_logs_updated'));
                }
                if (backupBadges) {
                    localStorage.setItem(STORAGE_KEYS.BADGES, backupBadges);
                    window.dispatchEvent(new Event('gamification_updated'));
                }
                if (backupSunnahPrayer) {
                    localStorage.setItem(STORAGE_KEYS.SUNNAH_PRAYER_LOGS, backupSunnahPrayer);
                    window.dispatchEvent(new Event('sunnah_prayer_logs_updated'));
                }
                if (backupDailyHabit) {
                    localStorage.setItem(STORAGE_KEYS.DAILY_HABIT_LOGS, backupDailyHabit);
                    window.dispatchEvent(new Event('daily_habit_logs_updated'));
                }
                clearBackup();
                return {
                    logs: restoredLogs,
                    settings: restoredSettings,
                    fastingLogs: restoredFasting,
                    dzikirLogs: restoredDzikir,
                    badges: restoredBadges,
                    sunnahPrayerLogs: restoredSunnahPrayer,
                    dailyHabitLogs: restoredDailyHabit
                };
            }
        }
        return null;
    }, [backupSource, userEmail, clearBackup]);

    const handleDeleteCloudData = useCallback(async () => {
        if (!userEmail) return;
        if (!window.confirm('PERINGATAN: Semua data Anda di cloud akan dihapus secara permanen. Data lokal Anda tidak akan terpengaruh. Lanjutkan?')) return;

        setIsSyncing(true);
        try {
            await deleteCloudData(userEmail);
            localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
            localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
            alert('Data cloud berhasil dihapus.');
        } catch (err) {
            console.error('Failed to delete cloud data:', err);
            alert('Gagal menghapus data cloud. Silakan coba lagi.');
            throw err;
        } finally {
            setIsSyncing(false);
        }
    }, [userEmail]);

    return { isSyncing, setIsSyncing, hasBackup, setHasBackup, backupSource, setBackupSource, handleUpload, handleDownload, handleRevert, clearBackup, handleDeleteCloudData };
};
