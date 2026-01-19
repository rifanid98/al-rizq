
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

    const handleUpload = useCallback(async (logs: PrayerLog[], settings: AppSettings) => {
        if (!userEmail) return;
        setIsSyncing(true);
        try {
            // Backup current cloud data before overwriting
            const result = await downloadFromCloud(userEmail);
            if (result && result.logs && result.logs.length > 0) {
                localStorage.setItem(STORAGE_KEYS.LOGS_BACKUP, JSON.stringify(result.logs));
                localStorage.setItem('al_rizq_backup_source', 'upload');
                setHasBackup(true);
                setBackupSource('upload');
            }

            const fastingLogsStr = localStorage.getItem(STORAGE_KEYS.FASTING_LOGS);
            const fastingLogs: FastingLog[] = fastingLogsStr ? JSON.parse(fastingLogsStr) : [];

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
        localStorage.removeItem('al_rizq_backup_source');
        setHasBackup(false);
        setBackupSource(null);
    }, []);

    const handleRevert = useCallback(async (currentLogs: PrayerLog[]) => {
        const backup = localStorage.getItem(STORAGE_KEYS.LOGS_BACKUP);
        const source = backupSource;

        if (!backup) return null;

        const confirmMessage = source === 'upload'
            ? 'Membatalkan upload akan mengembalikan data cloud ke kondisi sebelum upload. Lanjutkan?'
            : 'Membatalkan download akan mengembalikan data lokal ke kondisi sebelum download. Lanjutkan?';

        if (window.confirm(confirmMessage)) {
            const restoredLogs = JSON.parse(backup);

            if (source === 'upload') {
                if (userEmail) {
                    setIsSyncing(true);
                    try {
                        await uploadToCloud(userEmail, restoredLogs);
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
                localStorage.setItem(STORAGE_KEYS.LOGS, backup);
                clearBackup();
                return restoredLogs;
            }
        }
        return null;
    }, [backupSource, userEmail, clearBackup]);

    return { isSyncing, setIsSyncing, hasBackup, setHasBackup, backupSource, setBackupSource, handleUpload, handleDownload, handleRevert, clearBackup };
};
