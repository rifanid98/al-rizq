
import { useState, useCallback, useEffect } from 'react';
import { DailySchedule } from '../../../shared/types';
import { fetchPrayerTimes } from '../services/prayerService';
import { getLocalDateStr, getYesterdayDateStr } from '../../../shared/utils/helpers';
import { STORAGE_KEYS } from '../../../shared/constants';

export const usePrayerSchedule = () => {
    const [schedule, setSchedule] = useState<DailySchedule | null>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to parse prayer schedule", e);
            return null;
        }
    });
    const [yesterdaySchedule, setYesterdaySchedule] = useState<DailySchedule | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    const getSchedule = useCallback(async (options?: { address?: string; lat?: number; lng?: number }) => {
        setIsLoading(true);
        setError(null);
        try {
            let result: DailySchedule;
            if (options?.address) {
                result = await fetchPrayerTimes({ address: options.address });
            } else if (options?.lat && options?.lng) {
                result = await fetchPrayerTimes({ lat: options.lat, lng: options.lng });
                setLocation({ lat: options.lat, lng: options.lng });
            } else {
                // Default to geolocation
                const pos: any = await new Promise((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 })
                );
                result = await fetchPrayerTimes({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }
            setSchedule(result);
            localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(result));
            return result;
        } catch (err: any) {
            console.error(err);
            let errorMessage = 'Gagal mengambil jadwal sholat.';
            if (err.code === 1) errorMessage = 'Izin lokasi ditolak. Silakan cari lokasi secara manual.';
            else if (err.code === 2) errorMessage = 'Lokasi tidak tersedia.';
            else if (err.code === 3) errorMessage = 'Waktu pengambilan lokasi habis.';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getYesterdaySchedule = useCallback(async () => {
        if (yesterdaySchedule) return yesterdaySchedule;
        if (!schedule && !location) return null;

        try {
            const loc = location ? { lat: location.lat, lng: location.lng } : { address: schedule!.location };
            const result = await fetchPrayerTimes(loc, getYesterdayDateStr());
            setYesterdaySchedule(result);
            return result;
        } catch (err) {
            console.error("Failed to fetch yesterday's schedule", err);
            return null;
        }
    }, [schedule, location, yesterdaySchedule]);

    useEffect(() => {
        if (schedule) {
            localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
        }
    }, [schedule]);

    useEffect(() => {
        if (!schedule) {
            const lastLocation = localStorage.getItem(STORAGE_KEYS.LAST_KNOWN_LOCATION);
            if (lastLocation) {
                getSchedule({ address: lastLocation });
            }
        }
    }, []);

    return { schedule, setSchedule, yesterdaySchedule, setYesterdaySchedule, isLoading, error, setError, getSchedule, getYesterdaySchedule };
};
