
import { useMemo, useState, useEffect, useCallback } from 'react';
import { PrayerLog, FastingLog, DzikirLog, GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';
import { calculatePrayerPoints, calculateFastingPoints, calculateDzikirPoints, getLevel } from '../services/gamificationService';
import { calculatePrayerMetrics, calculateFastingMetrics, calculateDzikirMetrics, determineTier, getBadgeDefinition } from '../services/badgeService';
import { UserBadge } from '../../../shared/types/gamification';

const STORAGE_KEY_BADGES = 'al_rizq_badges';

export const useGamification = (
    logs: PrayerLog[],
    fastingLogs: FastingLog[],
    dzikirLogs: DzikirLog[],
    userConfig?: GamificationConfig
) => {
    const config = useMemo(() => {
        if (!userConfig) return DEFAULT_GAMIFICATION_CONFIG;

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

    // --- BADGE LOGIC ---
    const [userBadges, setUserBadges] = useState<UserBadge[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_BADGES);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const prayerMetrics = calculatePrayerMetrics(logs);
        const fastingMetrics = calculateFastingMetrics(fastingLogs);
        const dzikirMetrics = calculateDzikirMetrics(dzikirLogs);

        const allMetrics = { ...prayerMetrics, ...fastingMetrics, ...dzikirMetrics };

        let hasChanges = false;

        // We use function update to ensure we have latest state if effect runs rapidly
        setUserBadges(prev => {
            const nextState = [...prev];

            Object.entries(allMetrics).forEach(([badgeId, count]) => {
                const def = getBadgeDefinition(badgeId);
                if (!def) return;

                const existingIndex = nextState.findIndex(b => b.badgeId === badgeId);
                const existing = existingIndex >= 0 ? nextState[existingIndex] : null;

                // Preserve highest count
                const effectiveCount = Math.max(count, existing?.currentCount || 0);
                const newTier = determineTier(def, effectiveCount);

                if (!existing) {
                    // Initialize if > 0 or if we want to show 0 progress badges (optional).
                    // Let's initialize all found metrics so UI can show them locked
                    nextState.push({
                        badgeId,
                        currentCount: effectiveCount,
                        unlockedTier: newTier,
                        isNew: newTier !== null,
                        unlockedAt: newTier !== null ? Date.now() : undefined
                    });
                    hasChanges = true;
                } else {
                    if (effectiveCount !== existing.currentCount || newTier !== existing.unlockedTier) {
                        nextState[existingIndex] = {
                            ...existing,
                            currentCount: effectiveCount,
                            unlockedTier: newTier,
                            isNew: existing.isNew || (newTier !== existing.unlockedTier && newTier !== null),
                            unlockedAt: (newTier !== existing.unlockedTier && newTier !== null) ? Date.now() : existing.unlockedAt
                        };
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                localStorage.setItem(STORAGE_KEY_BADGES, JSON.stringify(nextState));
                return nextState;
            }
            return prev;
        });

    }, [logs, fastingLogs, dzikirLogs]); // Recalculate when logs change

    const markBadgeSeen = useCallback((badgeId: string) => {
        setUserBadges(prev => {
            const next = prev.map(b => b.badgeId === badgeId ? { ...b, isNew: false } : b);
            localStorage.setItem(STORAGE_KEY_BADGES, JSON.stringify(next));
            return next;
        });
    }, []);

    return {
        totalPoints: pointsDetail.total,
        pointsDetail,
        ...levelInfo,
        config,
        badges: userBadges,
        markBadgeSeen
    };
};
