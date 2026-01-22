import { useMemo, useState, useEffect, useCallback } from 'react';
import { PrayerLog, FastingLog, DzikirLog, GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';
import { calculatePrayerPoints, calculateFastingPoints, calculateDzikirPoints, getLevel } from '../services/gamificationService';
import { calculatePrayerMetrics, calculateFastingMetrics, calculateDzikirMetrics, determineTier, getBadgeDefinition } from '../services/badgeService';
import { UserBadge } from '../../../shared/types/gamification';
import { STORAGE_KEYS } from '../../../shared/constants';

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
    const getStoredBadges = useCallback(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.BADGES);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }, []);

    const [userBadges, setUserBadges] = useState<UserBadge[]>(getStoredBadges);
    const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<UserBadge | null>(null);

    // Sync state when storage changes externally (cross-tab or events)
    useEffect(() => {
        const handleUpdate = () => {
            setUserBadges(getStoredBadges());
        };
        window.addEventListener('gamification_updated', handleUpdate);
        window.addEventListener('app_data_reset', handleUpdate);
        return () => {
            window.removeEventListener('gamification_updated', handleUpdate);
            window.removeEventListener('app_data_reset', handleUpdate);
        };
    }, [getStoredBadges]);

    useEffect(() => {
        const prayerMetrics = calculatePrayerMetrics(logs);
        const fastingMetrics = calculateFastingMetrics(fastingLogs);
        const dzikirMetrics = calculateDzikirMetrics(dzikirLogs);

        const allMetrics = { ...prayerMetrics, ...fastingMetrics, ...dzikirMetrics };

        let hasChanges = false;
        let unlocked: UserBadge | null = null;

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
                    const newBadge: UserBadge = {
                        badgeId,
                        currentCount: effectiveCount,
                        unlockedTier: newTier,
                        isNew: newTier !== null,
                        unlockedAt: newTier !== null ? Date.now() : undefined
                    };
                    nextState.push(newBadge);
                    hasChanges = true;

                    // Trigger unlock animation for first tier unlock
                    if (newTier !== null) {
                        unlocked = newBadge;
                    }
                } else {
                    const tierChanged = newTier !== existing.unlockedTier && newTier !== null;

                    if (effectiveCount !== existing.currentCount || tierChanged) {
                        const updatedBadge: UserBadge = {
                            ...existing,
                            currentCount: effectiveCount,
                            unlockedTier: newTier,
                            isNew: existing.isNew || tierChanged,
                            unlockedAt: tierChanged ? Date.now() : existing.unlockedAt
                        };
                        nextState[existingIndex] = updatedBadge;
                        hasChanges = true;

                        // Trigger unlock animation for tier upgrade
                        if (tierChanged) {
                            unlocked = updatedBadge;
                        }
                    }
                }
            });

            if (hasChanges) {
                localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(nextState));

                // Set newly unlocked badge for animation (outside of state update)
                if (unlocked) {
                    setTimeout(() => setNewlyUnlockedBadge(unlocked), 100);
                }

                return nextState;
            }
            return prev;
        });

    }, [logs, fastingLogs, dzikirLogs]); // Recalculate when logs change

    const markBadgeSeen = useCallback((badgeId: string) => {
        setUserBadges(prev => {
            const next = prev.map(b => b.badgeId === badgeId ? { ...b, isNew: false } : b);
            localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(next));
            return next;
        });
    }, []);

    const clearNewlyUnlocked = useCallback(() => {
        if (newlyUnlockedBadge) {
            markBadgeSeen(newlyUnlockedBadge.badgeId);
        }
        setNewlyUnlockedBadge(null);
    }, [newlyUnlockedBadge, markBadgeSeen]);

    return {
        totalPoints: pointsDetail.total,
        pointsDetail,
        ...levelInfo,
        config,
        badges: userBadges,
        markBadgeSeen,
        newlyUnlockedBadge,
        clearNewlyUnlocked
    };
};
