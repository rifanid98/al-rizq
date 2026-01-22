
import { PrayerLog, FastingLog, DzikirLog } from '../../../shared/types';
import { BadgeDefinition, BadgeTier } from '../../../shared/types/gamification';
import { BADGES } from '../constants/badges';

// Helper to group logs by year
const groupByYear = <T extends { date: string }>(logs: T[]): Record<string, T[]> => {
    const groups: Record<string, T[]> = {};
    logs.forEach(log => {
        try {
            const y = new Date(log.date).getFullYear().toString();
            if (!isNaN(Number(y))) {
                if (!groups[y]) groups[y] = [];
                groups[y].push(log);
            }
        } catch (e) { }
    });
    return groups;
};

export const getBadgeDefinition = (id: string): BadgeDefinition | undefined => {
    // 1. Check exact match (static badges)
    const staticDef = BADGES.find(b => b.id === id);
    if (staticDef) return staticDef;

    // 2. Check for Yearly pattern: [base_id]_[year]
    // Regex: Match everything until the last underscore and 4 digits
    const match = id.match(/^(.+)_(\d{4})$/);
    if (match) {
        const baseId = match[1];
        // const year = match[2]; // Unused but available helper
        const baseDef = BADGES.find(b => b.id === baseId);

        if (baseDef) {
            return {
                ...baseDef,
                id: id // Return dynamic ID (e.g. prayer_ontime_2025)
            };
        }
    }
    return undefined;
};

export const determineTier = (def: BadgeDefinition, count: number): BadgeTier | null => {
    let highest: BadgeTier | null = null;
    for (const t of def.tiers) {
        if (count >= t.requirement) {
            highest = t.tier;
        }
    }
    return highest;
};


// Returns a map of badgeId -> count
export const calculatePrayerMetrics = (logs: PrayerLog[]): Record<string, number> => {
    const byYear = groupByYear(logs);
    const metrics: Record<string, number> = {};

    Object.entries(byYear).forEach(([year, yearLogs]) => {
        let onTimeCount = 0;
        let jamaahCount = 0;
        let mosqueCount = 0;
        let sunnahCount = 0;
        let subuhStreak = 0;

        yearLogs.forEach(log => {
            const isOnTime = log.status === 'Tepat Waktu' || (log as any).status === 'Ontime';
            const isCompleted = isOnTime || log.status === 'Terlambat';

            if (isOnTime) onTimeCount++;
            if (log.executionType === 'Jamaah' && isCompleted) jamaahCount++;
            if (log.locationType === 'Masjid' && isCompleted) mosqueCount++;
            if (log.hasQobliyah || log.hasBadiyah) sunnahCount++;
            if (log.prayerName === 'Subuh' && isOnTime) subuhStreak++;
        });

        if (onTimeCount > 0) metrics[`prayer_ontime_${year}`] = onTimeCount;
        if (jamaahCount > 0) metrics[`prayer_jamaah_${year}`] = jamaahCount;
        if (mosqueCount > 0) metrics[`prayer_mosque_${year}`] = mosqueCount;
        if (sunnahCount > 0) metrics[`prayer_sunnah_${year}`] = sunnahCount;
        if (subuhStreak > 0) metrics[`prayer_subuh_${year}`] = subuhStreak;
    });

    return metrics;
};

export const calculateFastingMetrics = (logs: FastingLog[]): Record<string, number> => {
    const byYear = groupByYear(logs);
    const metrics: Record<string, number> = {};

    Object.entries(byYear).forEach(([year, yearLogs]) => {
        let monThuCount = 0;
        let ayamulBidhCount = 0;
        let ramadhanCount = 0;
        let qadhaCount = 0; // Track count for tier logic

        // Tracking for completion check (all Qadha done)
        const qadhaLogs: FastingLog[] = [];

        yearLogs.forEach(log => {
            if (!log.isCompleted) return;

            // Standard counters
            if (log.type === 'Senin-Kamis') monThuCount++;
            if (log.type === 'Ayyamul Bidh') ayamulBidhCount++;
            if (log.type === 'Ramadhan') ramadhanCount++;

            // Qadha Logic
            if (log.type === 'Qadha' || log.isQadha) {
                qadhaCount++;
                qadhaLogs.push(log);
            }
        });

        // Metrics for Standard Badges
        if (monThuCount > 0) metrics[`fasting_mon_thu_${year}`] = monThuCount;
        if (ayamulBidhCount > 0) metrics[`fasting_ayamul_bidh_${year}`] = ayamulBidhCount;

        // Ramadhan: Just track count of days for now, or 1 if completed?
        // Current badge tiers: 1, 3, 5. Let's assume this means "Years completed".
        // BUT user wants yearly badges. So "Ramadhan 2025".
        // If they did Ramadhan in 2025, give them 1 point.
        // Wait, did they complete the WHOLE Ramadhan? Hard to track without total days.
        // Let's assume > 20 days is "Completed".
        const ramadhanCompleted = ramadhanCount > 20 ? 1 : 0;
        if (ramadhanCompleted > 0) metrics[`fasting_hero_${year}`] = ramadhanCompleted;

        // Qadha Badges
        // 1. The "Debt Slayer" (Completed ALL Qadha for this year)
        // This logic was relying on knowing how many they missed.
        // But for now, we just count them. 
        // Wait, the previous logic: `qadhaByYear[year] > 0` -> 1.
        // It was basically "If you did ANY Qadha in 2025...". 
        // Let's keep it simple: If they logged Qadha, give them count?
        // Original definition had tiers: 1, 10, 30, 100.
        // So we populate the count.
        if (qadhaCount > 0) metrics[`fasting_qadha_${year}`] = qadhaCount;
    });

    return metrics;
};

export const calculateDzikirMetrics = (logs: DzikirLog[]): Record<string, number> => {
    const byYear = groupByYear(logs);
    const metrics: Record<string, number> = {};

    Object.entries(byYear).forEach(([year, yearLogs]) => {
        let morningCount = 0;
        let eveningCount = 0;

        yearLogs.forEach(log => {
            if (!log.isCompleted) return;
            if (log.categoryId === 'pagi') morningCount++;
            if (log.categoryId === 'petang') eveningCount++;
        });

        if (morningCount > 0) metrics[`dzikir_morning_${year}`] = morningCount;
        if (eveningCount > 0) metrics[`dzikir_evening_${year}`] = eveningCount;
    });

    return metrics;
};

export const calculateConsistencyMetrics = (logs: any[]): Record<string, number> => {
    const year = new Date().getFullYear().toString();
    // MVP: 0 placeholder. Needs dedicated tracking.
    return {
        [`general_istiqomah_${year}`]: 0
    };
};
