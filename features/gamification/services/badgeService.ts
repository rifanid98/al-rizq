
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

export const getBadgeDefinition = (
    id: string,
    ramadhanConfig?: { startDate: string, endDate: string },
    qadhaConfig?: { customDates: string[]; days?: number[] }
): BadgeDefinition | undefined => {
    // 1. Check exact match (static badges)
    const staticDef = BADGES.find(b => b.id === id);
    if (staticDef) return staticDef;

    // 2. Check for Yearly pattern: [base_id]_[year]
    const match = id.match(/^(.+)_(\d{4})$/);
    if (match) {
        const baseId = match[1];
        const year = match[2];
        const baseDef = BADGES.find(b => b.id === baseId);

        if (baseDef) {
            const def = { ...baseDef, id };

            // Special handling for Ramadhan: Dynamic threshold and Gold only
            if (baseId === 'fasting_hero' && ramadhanConfig?.startDate && ramadhanConfig?.endDate) {
                const configYear = new Date(ramadhanConfig.startDate).getFullYear().toString();
                if (configYear === year) {
                    const start = new Date(ramadhanConfig.startDate);
                    const end = new Date(ramadhanConfig.endDate);
                    const diff = end.getTime() - start.getTime();
                    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

                    // Force a single Gold tier with the dynamic requirement
                    def.tiers = [{ tier: 'gold', requirement: totalDays }];
                } else {
                    // Safety fallback
                    def.tiers = [{ tier: 'gold', requirement: 30 }];
                }
            }

            // Special handling for Qadha: Dynamic threshold (all set Qadha dates for that year)
            if (baseId === 'fasting_qadha_annual') {
                if (qadhaConfig) {
                    // Count custom dates for this year
                    const customDatesCount = (qadhaConfig.customDates || []).filter(d => d.startsWith(`${year}-`)).length;

                    // Count occurrences of scheduled days (0-6) for this year
                    let recurringCount = 0;
                    const scheduledDays = qadhaConfig.days || [];
                    if (scheduledDays.length > 0) {
                        const startOfYear = new Date(parseInt(year), 0, 1);
                        const endOfYear = new Date(parseInt(year), 11, 31);
                        for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
                            if (scheduledDays.includes(d.getDay())) {
                                recurringCount++;
                            }
                        }
                    }

                    const totalQadha = customDatesCount + recurringCount;

                    // Threshold is the total number of Qadha set for that year
                    // If they set nothing, requirement is effectively infinite (until they plan something)
                    def.tiers = [{ tier: 'gold', requirement: totalQadha > 0 ? totalQadha : 999 }];
                } else {
                    // Config missing: set impossible requirement to prevent accidental unlock
                    def.tiers = [{ tier: 'gold', requirement: 999 }];
                }
            }

            return def;
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
        let qadhaCount = 0;

        yearLogs.forEach(log => {
            if (!log.isCompleted) return;

            if (log.type === 'Senin-Kamis') monThuCount++;
            if (log.type === 'Ayyamul Bidh') ayamulBidhCount++;
            if (log.type === 'Ramadhan') ramadhanCount++;
            if (log.type === 'Qadha' || log.isQadha) qadhaCount++;
        });

        if (monThuCount > 0) metrics[`fasting_mon_thu_${year}`] = monThuCount;
        if (ayamulBidhCount > 0) metrics[`fasting_ayamul_bidh_${year}`] = ayamulBidhCount;

        // Return actual days for Ramadhan
        if (ramadhanCount > 0) metrics[`fasting_hero_${year}`] = ramadhanCount;

        if (qadhaCount > 0) {
            metrics[`fasting_qadha_annual_${year}`] = qadhaCount;
        }
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
