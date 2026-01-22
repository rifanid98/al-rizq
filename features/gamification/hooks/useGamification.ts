
import { useMemo } from 'react';
import { PrayerLog, FastingLog, DzikirLog, GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';
import { calculatePrayerPoints, calculateFastingPoints, calculateDzikirPoints, getLevel } from '../services/gamificationService';

export const useGamification = (
    logs: PrayerLog[],
    fastingLogs: FastingLog[],
    dzikirLogs: DzikirLog[],
    userConfig?: GamificationConfig
) => {
    const config = userConfig || DEFAULT_GAMIFICATION_CONFIG;

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
