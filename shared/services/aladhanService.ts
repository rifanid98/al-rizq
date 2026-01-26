
import { HijriDate } from "../types";

const BASE_URL = 'http://api.aladhan.com/v1';

interface AladhanHijriResponse {
    code: number;
    status: string;
    data: Array<{
        gregorian: {
            date: string;
            format: string;
            day: string;
            weekday: { en: string };
            month: { number: number; en: string };
            year: string;
        };
        hijri: {
            date: string;
            format: string;
            day: string;
            weekday: { en: string; ar: string };
            month: { number: number; en: string; ar: string };
            year: string;
            designation: { abbreviated: string; expanded: string };
            holidays: string[];
        };
    }>;
}

export const aladhanService = {
    /**
     * Fetch Hijri Calendar for a specific Gregorian Month
     * @param month Gregorian Month (1-12)
     * @param year Gregorian Year
     */
    getGregorianToHijriCalendar: async (month: number, year: number): Promise<AladhanHijriResponse | null> => {
        try {
            const response = await fetch(`${BASE_URL}/gToHCalendar/${month}/${year}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[AladhanService] Error fetching calendar:', error);
            return null;
        }
    },

    /**
     * Fetch Hijri To Gregorian Calendar
     * @param month Hijri Month (1-12)
     * @param year Hijri Year
     */
    getHijriToGregorianCalendar: async (month: number, year: number): Promise<AladhanHijriResponse | null> => {
        try {
            const response = await fetch(`${BASE_URL}/hToGCalendar/${month}/${year}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[AladhanService] Error fetching hijri calendar:', error);
            return null;
        }
    },

    /**
     * Map Aladhan Hijri Object to our internal HijriDate type
     */
    mapToHijriDate: (apiHijri: any): HijriDate => {
        return {
            day: apiHijri.day,
            month: {
                number: apiHijri.month.number,
                en: apiHijri.month.en,
                ar: apiHijri.month.ar
            },
            year: apiHijri.year,
            designation: {
                abbreviated: apiHijri.designation.abbreviated,
                expanded: apiHijri.designation.expanded
            }
        };
    }
};
