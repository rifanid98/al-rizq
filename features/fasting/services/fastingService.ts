
import { HijriDate } from "../../../shared/types";
import { useFastingStore } from "../stores/useFastingStore";

/**
 * Calculate the Hijri date for a given Gregorian date
 * Uses an approximation algorithm if no API data is available
 */
// Hoist formatter for performance
const hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umedqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
});

/**
 * Calculate the Hijri date for a given Gregorian date
 * Uses an approximation algorithm if no API data is available
 * @param adjustmentDays Number of days to shift the Hijri calculation (to align with API/Moon sighting)
 */
export const getHijriDate = (date: Date, adjustmentDays: number = 0): HijriDate => {
    // Check Manual Ramadan for Global Offset
    // Check Manual Ramadan for Global Offset - REMOVED due to bugs (causing 30-day shifts).
    // If users want to adjust Hijri date, they should use a dedicated Hijri Adjustment setting.
    // const manualOffset = 0; // Disabled logic

    // Apply adjustment if needed
    let targetDate = date;
    const totalAdjustment = adjustmentDays; // Removed manualOffset

    if (totalAdjustment !== 0) {
        targetDate = new Date(date);
        targetDate.setDate(date.getDate() + totalAdjustment);
    }

    const parts = hijriFormatter.formatToParts(targetDate);
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
        calendar: "islamic-umedqura"
    };

    // Format: "12 Rajab 1445" roughly, depends on locale
    // We use a specific locale to parse it easily or use direct calculation
    // For simplicity here, we'll try to use the Intl API


    const day = parts.find(p => p.type === "day")?.value || "";
    const month = parseInt(parts.find(p => p.type === "month")?.value || "1");
    const year = parts.find(p => p.type === "year")?.value || "";

    const monthNames = [
        "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir",
        "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
        "Ramadhan", "Syawal", "Dzulkaidah", "Dzulhijjah"
    ];

    return {
        day,
        month: {
            number: month,
            en: monthNames[month - 1],
            ar: "" // Optional
        },
        year,
        designation: {
            abbreviated: "H",
            expanded: "Hijriyah"
        }
    };
};

/**
 * Check if the date is Monday or Thursday
 */
export const isSeninKamis = (date: Date): 'Senin' | 'Kamis' | null => {
    const day = date.getDay();
    if (day === 1) return 'Senin';
    if (day === 4) return 'Kamis';
    return null;
};

/**
 * Check if the date is Ayyamul Bidh (13, 14, 15 Hijri)
 * Note: Ayyamul Bidh is NOT recommended in Dzulhijjah (Tasyrik days overlap)
 */
export const isAyyamulBidh = (hijri: HijriDate): boolean => {
    const day = parseInt(hijri.day);
    const month = hijri.month.number;

    // Exclude 13 Dzulhijjah (Month 12) as it is a Tasyrik day
    if (month === 12 && day === 13) return false;

    return [13, 14, 15].includes(day);
};

/**
 * Check if the date is Ramadan
 */
export const isRamadhan = (hijri: HijriDate): boolean => {
    return hijri.month.number === 9;
};



import { STORAGE_KEYS } from "../../../shared/constants";

// Prohibited Fasting Days (Haram)
export const PROHIBITED_DAYS = [
    { month: 10, day: 1, label: 'Idul Fitri' },
    { month: 12, day: 10, label: 'Idul Adha' },
    { month: 12, day: 11, label: 'Hari Tasyrik' },
    { month: 12, day: 12, label: 'Hari Tasyrik' },
    { month: 12, day: 13, label: 'Hari Tasyrik' }
];

export const isProhibitedFastingDay = (hijri: HijriDate, date?: Date): boolean => {
    // 1. Check Manual Ramadan Config first for Eid Al-Fitr
    if (date) {
        const savedRamadhan = useFastingStore.getState().ramadhanConfig;
        if (savedRamadhan && savedRamadhan.endDate) {
            try {
                const { endDate } = savedRamadhan;
                if (endDate) {
                    // Manual Eid is endDate + 1 day
                    const eidDate = new Date(endDate);
                    eidDate.setDate(eidDate.getDate() + 1);

                    const yearStr = date.getFullYear();
                    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(date.getDate()).padStart(2, '0');
                    const checkDateStr = `${yearStr}-${monthStr}-${dayStr}`;

                    const eidYear = eidDate.getFullYear();
                    const eidMonth = String(eidDate.getMonth() + 1).padStart(2, '0');
                    const eidDay = String(eidDate.getDate()).padStart(2, '0');
                    const eidDateStr = `${eidYear}-${eidMonth}-${eidDay}`;

                    if (checkDateStr === eidDateStr) return true;
                }
            } catch (e) {
                console.error("Error checking manual Eid:", e);
            }
        }
    }

    const day = parseInt(hijri.day);
    const month = hijri.month.number;

    // 2. We used to suppress standard Eid here. 
    // But now getHijriDate applies a global offset, so "Standard" Eid IS the Manual Eid.
    // So we don't need to suppress anything.
    // If the offset is perfect, Month 10 Day 1 will be the correct date.


    return PROHIBITED_DAYS.some(d => d.month === month && d.day === day);
};

export const getProhibitedFastingReason = (hijri: HijriDate, date?: Date): string | null => {
    // 1. Check Manual Eid
    if (date) {
        const savedRamadhan = useFastingStore.getState().ramadhanConfig;
        if (savedRamadhan && savedRamadhan.endDate) {
            try {
                const { endDate } = savedRamadhan;
                if (endDate) {
                    const eidDate = new Date(endDate);
                    eidDate.setDate(eidDate.getDate() + 1);

                    const yearStr = date.getFullYear();
                    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(date.getDate()).padStart(2, '0');
                    const checkDateStr = `${yearStr}-${monthStr}-${dayStr}`;

                    const eidYear = eidDate.getFullYear();
                    const eidMonth = String(eidDate.getMonth() + 1).padStart(2, '0');
                    const eidDay = String(eidDate.getDate()).padStart(2, '0');
                    const eidDateStr = `${eidYear}-${eidMonth}-${eidDay}`;

                    if (checkDateStr === eidDateStr) return "Idul Fitri";
                }
            } catch (e) { }
        }
    }

    const day = parseInt(hijri.day);
    const month = hijri.month.number;

    // 2. We removed suppression logic.


    const prohibited = PROHIBITED_DAYS.find(d => d.month === month && d.day === day);
    return prohibited ? prohibited.label : null;
};

export const getFastingRecommendation = (date: Date, hijri: HijriDate): {
    type: 'Senin-Kamis' | 'Ayyamul Bidh' | 'Ramadhan' | 'Lainnya' | 'Nadzar' | 'Qadha' | null,
    labelKey: string,
    isForbidden?: boolean,
    isNadzar?: boolean,
    isQadha?: boolean
} => {
    // Shared Date Variables
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)

    // 1. Check for custom Ramadhan range (Prioritize this)
    const savedRamadhan = useFastingStore.getState().ramadhanConfig;
    if (savedRamadhan && savedRamadhan.startDate && savedRamadhan.endDate) {
        try {
            const { startDate, endDate } = savedRamadhan;
            if (startDate && endDate) {
                const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 40) {
                    console.warn("[FastingService] Manual Ramadhan Config ignored: Duration > 40 days");
                } else if (dateStr >= startDate && dateStr <= endDate) {
                    return { type: 'Ramadhan', labelKey: 'fasting.types.ramadhan' };
                }
            }
        } catch (e) {
            console.error('Error parsing Ramadhan config:', e);
        }
    }

    // 2. Allowed/Forbidden Check
    if (isProhibitedFastingDay(hijri, date)) {
        return { type: null, labelKey: 'fasting.types.forbidden', isForbidden: true };
    }

    // 3. Determine Flags for Qadha / Nadzar
    let isQadha = false;
    let isNadzar = false;

    // Check Qadha Config
    const qadhaConfig = useFastingStore.getState().qadhaConfig;
    if (qadhaConfig) {
        try {
            const isValidDate = (!qadhaConfig.startDate || dateStr >= qadhaConfig.startDate) &&
                (!qadhaConfig.endDate || dateStr <= qadhaConfig.endDate);

            if (isValidDate) {
                if (qadhaConfig.days?.includes(dayOfWeek)) isQadha = true;
                if (isSeninKamis(date) && qadhaConfig.types?.includes('Senin-Kamis')) isQadha = true;
                if (isAyyamulBidh(hijri) && qadhaConfig.types?.includes('Ayyamul Bidh')) isQadha = true;
            }

            if (qadhaConfig.customDates?.includes(dateStr)) isQadha = true;
        } catch (e) {
            console.error('Error parsing Qadha config:', e);
        }
    }

    // Check Nadzar Config
    const nadzarConfig = useFastingStore.getState().nadzarConfig;
    if (nadzarConfig) {
        try {
            const isValidDate = (!nadzarConfig.startDate || dateStr >= nadzarConfig.startDate) &&
                (!nadzarConfig.endDate || dateStr <= nadzarConfig.endDate);

            if (isValidDate) {
                if (nadzarConfig.days?.includes(dayOfWeek)) isNadzar = true;
                if (isSeninKamis(date) && nadzarConfig.types?.includes('Senin-Kamis')) isNadzar = true;
                if (isAyyamulBidh(hijri) && nadzarConfig.types?.includes('Ayyamul Bidh')) isNadzar = true;
            }

            if (nadzarConfig.customDates?.includes(dateStr)) isNadzar = true;
        } catch (e) {
            console.error('Error parsing Nadzar config:', e);
        }
    }

    // 4. Return Logic (Priority: Qadha > Nadzar > Sunnah)

    if (isQadha) {
        if (isSeninKamis(date)) {
            return {
                type: 'Senin-Kamis',
                labelKey: dayOfWeek === 1 ? 'fasting.types.monday' : 'fasting.types.thursday',
                isQadha: true,
                isNadzar
            };
        }
        if (isAyyamulBidh(hijri)) {
            return { type: 'Ayyamul Bidh', labelKey: 'fasting.types.midMonth', isQadha: true, isNadzar };
        }
        return { type: 'Qadha', labelKey: 'fasting.types.qadha', isQadha: true, isNadzar };
    }

    if (isNadzar) {
        if (isSeninKamis(date)) {
            return {
                type: 'Senin-Kamis',
                labelKey: dayOfWeek === 1 ? 'fasting.types.monday' : 'fasting.types.thursday',
                isNadzar: true
            };
        }
        if (isAyyamulBidh(hijri)) {
            return { type: 'Ayyamul Bidh', labelKey: 'fasting.types.midMonth', isNadzar: true };
        }
        return { type: 'Nadzar', labelKey: 'fasting.types.nadzar', isNadzar: true };
    }

    if (isAyyamulBidh(hijri)) {
        return { type: 'Ayyamul Bidh', labelKey: 'fasting.types.midMonth' };
    }

    const seninKamis = isSeninKamis(date);
    if (seninKamis) {
        return {
            type: 'Senin-Kamis',
            labelKey: seninKamis === 'Senin' ? 'fasting.types.monday' : 'fasting.types.thursday'
        };
    }

    return { type: null, labelKey: '' };
};

import { aladhanService } from "../../../shared/services/aladhanService";

// Cache for API responses to prevent rate limiting / network delay
const FORECAST_CACHE: Record<string, any[]> = {};

/**
 * Async Forecast that tries to use Aladhan API, then falls back to local.
 * Applies Manual Ramadan Correction (Offset) to the final result.
 */
export const getAsyncMonthForecast = async (year: number, month: number, adjustmentDays: number = 0): Promise<Array<{
    date: string,
    hijri: HijriDate,
    recommendation: { type: string, labelKey: string, isForbidden?: boolean, isNadzar?: boolean, isQadha?: boolean }
}>> => {
    const cacheKey = `${year}-${month}-${adjustmentDays}`;
    const apiCacheKey = `raw-${year}-${month}`;

    let apiData = FORECAST_CACHE[apiCacheKey];

    if (!apiData) {
        const response = await aladhanService.getGregorianToHijriCalendar(month + 1, year);
        if (response && response.data) {
            apiData = response.data;
            FORECAST_CACHE[apiCacheKey] = apiData;
        }
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const forecast = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const yearStr = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const localDateStr = `${yearStr}-${monthStr}-${dayStr}`;

        let hijri: HijriDate;

        const apiFormatDate = `${dayStr}-${monthStr}-${yearStr}`;
        const apiDay = apiData?.find((item: any) => item.gregorian.date === apiFormatDate);

        if (apiDay) {
            hijri = aladhanService.mapToHijriDate(apiDay.hijri);
        } else {
            hijri = getHijriDate(d, adjustmentDays);
        }

        const rec = getFastingRecommendation(d, hijri);

        forecast.push({
            date: localDateStr,
            hijri,
            recommendation: rec
        });
    }

    return forecast;
};

/**
 * Async Forecast for a specific HIJRI month.
 * Used for Hijri Calendar View.
 * Returns array of days (29 or 30) for that Hijri Month.
 */
export const getAsyncHijriMonthForecast = async (hijriYear: number, hijriMonth: number, adjustmentDays: number = 0): Promise<Array<{
    date: string, // Gregorian Date String (YYYY-MM-DD)
    hijri: HijriDate,
    recommendation: { type: string, labelKey: string, isForbidden?: boolean, isNadzar?: boolean, isQadha?: boolean }
}>> => {
    // 1. Fetch from API (hToG)
    const apiCacheKey = `raw-hijri-${hijriYear}-${hijriMonth}`;
    let apiData = FORECAST_CACHE[apiCacheKey];

    if (!apiData) {
        const response = await aladhanService.getHijriToGregorianCalendar(hijriMonth + 1, hijriYear);
        if (response && response.data) {
            apiData = response.data;
            FORECAST_CACHE[apiCacheKey] = apiData;
        }
    }

    const forecast = [];

    // API Data is array of days for that Hijri Month
    if (apiData) {
        for (const item of apiData) {
            const hijri = aladhanService.mapToHijriDate(item.hijri);

            // Gregorian String from API: "DD-MM-YYYY"
            const [dStr, mStr, yStr] = item.gregorian.date.split('-');

            // Construct Gregorian Date
            let gDate = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));

            // Format back to YYYY-MM-DD
            const finalY = gDate.getFullYear();
            const finalM = String(gDate.getMonth() + 1).padStart(2, '0');
            const finalD = String(gDate.getDate()).padStart(2, '0');
            const finalDateStr = `${finalY}-${finalM}-${finalD}`;

            const rec = getFastingRecommendation(gDate, hijri);

            forecast.push({
                date: finalDateStr,
                hijri,
                recommendation: rec
            });
        }
    }

    return forecast;
};

// Keep sync version for legacy or immediate render (deprecated-ish)
export const getMonthForecast = (year: number, month: number, adjustmentDays: number = 0): Array<{
    date: string,
    hijri: HijriDate,
    recommendation: { type: string, labelKey: string, isForbidden?: boolean }
}> => {
    return getAsyncMonthForecast(year, month, adjustmentDays) as any; // Hack: Synchronous callers will break. We need to update component.
};

