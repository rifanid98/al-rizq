
import { useState, useCallback } from 'react';
import { PrayerLog, AppSettings, FastingLog } from '../../../shared/types';
import { uploadToCloud, downloadFromCloud } from '../services/syncService';
import { STORAGE_KEYS } from '../../../shared/constants';

export const useSync = (userEmail: string | undefined) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasBackup, setHasBackup] = useState(!!localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP));
    const [backupSource, setBackupSource] = useState<'upload' | 'download' | null>(() => {
        return (localStorage.getItem('al_rizq_backup_source') as 'upload' | 'download') || null;
    });

    const handleUpload = useCallback(async (logs: PrayerLog[], settings: AppSettings, fastingLogs: FastingLog[]) => {
        if (!userEmail) return;
        setIsSyncing(true);
        try {
            // Backup current cloud data before overwriting
            const result = await downloadFromCloud(userEmail);
            if (result) {
                if (result.logs) localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(result.logs));
                if (result.fastingLogs) localStorage.setItem('al_rizq_fasting_logs_backup', JSON.stringify(result.fastingLogs));
                if (result.settings) localStorage.setItem('al_rizq_settings_backup', JSON.stringify(result.settings));

                localStorage.setItem('al_rizq_backup_source', 'upload');
                setHasBackup(true);
                setBackupSource('upload');
            }

            const timestamp = await uploadToCloud(userEmail, logs, settings, fastingLogs);
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

                // Ideally backup settings too, but we need them passed in or read from storage if stored separately.
                // Settings are usually in local storage or computed. 
                // For now let's focus on logs as settings are less critical to lose on download (usually user wants cloud settings), 
                // but user asked for "pengaturan puasa" backup.

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
        localStorage.removeItem('al_rizq_settings_backup');
        localStorage.removeItem('al_rizq_backup_source');
        setHasBackup(false);
        setBackupSource(null);
    }, []);

    const handleRevert = useCallback(async (currentLogs: PrayerLog[]) => {
        const backupLogs = localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP);
        const backupFasting = localStorage.getItem('al_rizq_fasting_logs_backup');
        const backupSettings = localStorage.getItem('al_rizq_settings_backup');
        const source = backupSource;

        if (!backupLogs) return null;

        const confirmMessage = source === 'upload'
            ? 'Membatalkan upload akan mengembalikan data cloud ke kondisi sebelum upload. Lanjutkan?'
            : 'Membatalkan download akan mengembalikan data lokal ke kondisi sebelum download. Lanjutkan?';

        if (window.confirm(confirmMessage)) {
            const restoredLogs = JSON.parse(backupLogs);
            const restoredFasting = backupFasting ? JSON.parse(backupFasting) : [];
            const restoredSettings = backupSettings ? JSON.parse(backupSettings) : undefined;

            if (source === 'upload') {
                if (userEmail) {
                    setIsSyncing(true);
                    try {
                        await uploadToCloud(userEmail, restoredLogs, restoredSettings, restoredFasting);
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
                clearBackup();
                return { logs: restoredLogs, settings: restoredSettings, fastingLogs: restoredFasting };
            }
        }
        return null;
    }, [backupSource, userEmail, clearBackup]);

    return { isSyncing, setIsSyncing, hasBackup, setHasBackup, backupSource, setBackupSource, handleUpload, handleDownload, handleRevert, clearBackup };
};
