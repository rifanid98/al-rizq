
import { useMemo } from 'react';
import { PrayerLog, FastingLog, DzikirLog, GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';
import { calculatePrayerPoints, calculateFastingPoints, calculateDzikirPoints, getLevel } from '../services/gamificationService';

export const useGamification = (
    logs: PrayerLog[],
    fastingLogs: FastingLog[],
    dzikirLogs: DzikirLog[],
    userConfig?: GamificationConfig
) => {
    const config = useMemo(() => {
        if (!userConfig) return DEFAULT_GAMIFICATION_CONFIG;

        // Deep merge points to ensure new point types from updates are present
        return {
            ...DEFAULT_GAMIFICATION_CONFIG,
            ...userConfig,
            points: {
                prayer: { ...DEFAULT_GAMIFICATION_CONFIG.points.prayer, ...userConfig.points?.prayer },
                fasting: { ...DEFAULT_GAMIFICATION_CONFIG.points.fasting, ...userConfig.points?.fasting },
                dzikir: { ...DEFAULT_GAMIFICATION_CONFIG.points.dzikir, ...userConfig.points?.dzikir },
            }
        };
    }, [userConfig]);

    const pointsDetail = useMemo(() => {
        let prayerPoints = 0;
        let fastingPoints = 0;
        let dzikirPoints = 0;

        logs.forEach(log => {
            prayerPoints += calculatePrayerPoints(log, config);
        });

        fastingLogs.forEach(log => {
            fastingPoints += calculateFastingPoints(log, config);
        });

        dzikirLogs.forEach(log => {
            dzikirPoints += calculateDzikirPoints(log, config);
        });

        return {
            prayer: prayerPoints,
            fasting: fastingPoints,
            dzikir: dzikirPoints,
            total: prayerPoints + fastingPoints + dzikirPoints
        };
    }, [logs, fastingLogs, dzikirLogs, config]);

    const levelInfo = useMemo(() => {
        return getLevel(pointsDetail.total);
    }, [pointsDetail.total]);

    return {
        totalPoints: pointsDetail.total,
        pointsDetail,
        ...levelInfo,
        config
    };
};
