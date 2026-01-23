import React from 'react';
import { BadgeCollection } from './BadgeCollection';
import { GamificationStats } from './GamificationStats';
import { UserBadge, LevelTier } from '../../../shared/types/gamification';
import { useLanguage } from '../../../shared/hooks/useLanguage';

interface AchievementsProps {
    gamification: {
        totalPoints: number;
        level: number;
        progress: number;
        nextThreshold: number;
        currentPoints: number;
        currentLevelThreshold: number;
        pointsInLevel: number;
        pointsNeededForLevel: number;
        badges: UserBadge[];
        levelName?: string;
        levelTier?: LevelTier;
    };
    logs: any[]; // Prayer logs for stats if needed
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}

export const Achievements: React.FC<AchievementsProps> = ({ gamification, logs, ramadhanConfig, qadhaConfig }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            {/* Stats Header */}
            <GamificationStats
                totalPoints={gamification.totalPoints}
                level={gamification.level}
                levelName={gamification.levelName}
                nextThreshold={gamification.nextThreshold}
                currentLevelThreshold={gamification.currentLevelThreshold}
                pointsInLevel={gamification.pointsInLevel}
                pointsNeededForLevel={gamification.pointsNeededForLevel}
                progress={gamification.progress}
                levelTier={gamification.levelTier}
            />

            {/* Title for Badges Section */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    {t.gamification?.badges?.collectionTitle || 'Badge Collection'}
                </h3>
            </div>

            {/* Badges Grid */}
            <BadgeCollection userBadges={gamification.badges} ramadhanConfig={ramadhanConfig} qadhaConfig={qadhaConfig} />
        </div>
    );
};
