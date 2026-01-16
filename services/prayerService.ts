
import { DailySchedule, PrayerName } from "../types";
import { getCache, setCache, getLocalDateStr } from "../utils/helpers";

/**
 * Search locations using OpenStreetMap Nominatim API (No API Key required)
 */
export const searchLocations = async (query: string): Promise<string[]> => {
    if (query.length < 3) return [];

    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=id`
        );
        const data = await response.json();

        const results = data.map((item: any) => item.display_name);
        setCache(cacheKey, results);
        return results;
    } catch (error) {
        console.error("Search Location Error:", error);
        return [];
    }
};

/**
 * Fetch prayer times using Aladhan API (Method 11 for Kemenag Indonesia)
 */
export const fetchPrayerTimes = async (location: { lat: number; lng: number } | { address: string }, dateOverride?: string): Promise<DailySchedule> => {
    const date = dateOverride || getLocalDateStr();
    const cacheKey = `prayer_${JSON.stringify(location)}_${date}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    let url = '';
    if ('address' in location) {
        url = `https://api.aladhan.com/v1/timingsByAddress/${date}?address=${encodeURIComponent(location.address)}&method=11`;
    } else {
        url = `https://api.aladhan.com/v1/timings/${date}?latitude=${location.lat}&longitude=${location.lng}&method=11`;
    }

    try {
        const response = await fetch(url);
        const resData = await response.json();

        if (resData.code !== 200) {
            throw new Error(resData.data || "Gagal mengambil data waktu sholat.");
        }

        const { timings, meta } = resData.data;

        const prayerNamesMapping: Record<string, PrayerName> = {
            'Fajr': 'Subuh',
            'Dhuhr': 'Dzuhur',
            'Asr': 'Ashar',
            'Maghrib': 'Maghrib',
            'Isha': 'Isya'
        };

        const order: PrayerName[] = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
        const finalPrayers = order.map(name => {
            const key = Object.keys(prayerNamesMapping).find(k => prayerNamesMapping[k] === name);
            return {
                name,
                time: timings[key || ''] || '00:00'
            };
        });

        const result: DailySchedule = {
            date: date,
            location: 'address' in location ? location.address : `Lat: ${location.lat.toFixed(2)}, Lng: ${location.lng.toFixed(2)}`,
            prayers: finalPrayers,
            sources: [{
                title: "Kemenag RI via Aladhan API",
                uri: "https://aladhan.com/prayer-times-api"
            }]
        };

        setCache(cacheKey, result);
        return result;
    } catch (error: any) {
        console.error("Prayer API Error:", error);
        throw error;
    }
};
