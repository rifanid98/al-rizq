
import { HijriDate } from "../../../shared/types";

/**
 * Calculate the Hijri date for a given Gregorian date
 * Uses an approximation algorithm if no API data is available
 */
export const getHijriDate = (date: Date): HijriDate => {
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
        calendar: "islamic-umedqura"
    };

    // Format: "12 Rajab 1445" roughly, depends on locale
    // We use a specific locale to parse it easily or use direct calculation
    // For simplicity here, we'll try to use the Intl API

    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umedqura", {
        day: "numeric",
        month: "numeric",
        year: "numeric"
    });

    const parts = formatter.formatToParts(date);
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

export const getFastingRecommendation = (date: Date, hijri: HijriDate): {
    type: 'Senin-Kamis' | 'Ayyamul Bidh' | 'Ramadhan' | 'Lainnya' | 'Nadzar' | 'Qadha' | null,
    labelKey: string,
    isForbidden?: boolean
} => {
    // Check for custom Ramadhan range from localStorage
    const savedRamadhan = localStorage.getItem(STORAGE_KEYS.RAMADHAN_CONFIG);
    if (savedRamadhan) {
        try {
            const { startDate, endDate } = JSON.parse(savedRamadhan);
            if (startDate && endDate) {
                // Fix: Normalize dates to YYYY-MM-DD for comparison
                const yearStr = date.getFullYear();
                const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                const dayStr = String(date.getDate()).padStart(2, '0');
                const localDateStr = `${yearStr}-${monthStr}-${dayStr}`;

                if (localDateStr >= startDate && localDateStr <= endDate) {
                    return { type: 'Ramadhan', labelKey: 'fasting.types.ramadhan' };
                }
            }
        } catch (e) {
            console.error('Error parsing Ramadhan config:', e);
        }
    }

    if (isRamadhan(hijri)) {
        return { type: 'Ramadhan', labelKey: 'fasting.types.ramadhan' };
    }

    // Haram days check (Eid Al-Fitr 1 Syawal, Eid Al-Adha 10 Dzulhijjah, Tasyrik 11-13 Dzulhijjah)
    const hDay = parseInt(hijri.day);
    const hMonth = hijri.month.number;

    if (hMonth === 10 && hDay === 1) return { type: null, labelKey: 'fasting.types.forbidden', isForbidden: true }; // Eid Al-Fitr
    if (hMonth === 12 && hDay === 10) return { type: null, labelKey: 'fasting.types.forbidden', isForbidden: true }; // Eid Al-Adha
    if (hMonth === 12 && [11, 12, 13].includes(hDay)) return { type: null, labelKey: 'fasting.types.forbidden', isForbidden: true }; // Tasyrik

    // Priority: Qadha > Nadzar > Sunnah

    // Check Qadha Config
    const savedQadha = localStorage.getItem(STORAGE_KEYS.QADHA_CONFIG);
    if (savedQadha) {
        try {
            const qadhaConfig = JSON.parse(savedQadha);
            const day = date.getDay();
            const yearStr = date.getFullYear();
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

            if (qadhaConfig.days?.includes(day) || qadhaConfig.customDates?.includes(dateStr)) {
                return { type: 'Qadha', labelKey: 'fasting.types.qadha' };
            }
        } catch (e) {
            console.error('Error parsing Qadha config:', e);
        }
    }

    // Check Nadzar Config
    const savedNadzar = localStorage.getItem(STORAGE_KEYS.NADZAR_CONFIG);
    if (savedNadzar) {
        try {
            const nadzarConfig = JSON.parse(savedNadzar);
            const day = date.getDay();
            const yearStr = date.getFullYear();
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

            if (nadzarConfig.days?.includes(day) || nadzarConfig.customDates?.includes(dateStr)) {
                return { type: 'Nadzar', labelKey: 'fasting.types.nadzar' };
            }
        } catch (e) {
            console.error('Error parsing Nadzar config:', e);
        }
    }

    if (isAyyamulBidh(hijri)) {
        // Even if it's Ayyamul Bidh, if user configures it as Nadzar/Qadha type, it should return that?
        // Actually the check for 'types' (like Senin-Kamis is Nadzar) is handled in FastingTracker UI
        // But for recommendation, we return the base sunnah type if not explicitly overriden by day/date.
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

export const getMonthForecast = (year: number, month: number): Array<{
    date: string,
    hijri: HijriDate,
    recommendation: { type: string, labelKey: string, isForbidden?: boolean }
}> => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const forecast = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const hijri = getHijriDate(d);
        const rec = getFastingRecommendation(d, hijri);

        // Fix: Use local date components to avoid UTC shift
        const yearStr = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const localDateStr = `${yearStr}-${monthStr}-${dayStr}`;

        forecast.push({
            date: localDateStr,
            hijri,
            recommendation: rec
        });
    }

    return forecast;
};
