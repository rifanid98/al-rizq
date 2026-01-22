export type BadgeCategory = 'prayer' | 'fasting' | 'dzikir' | 'general';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeTierRequirement {
    tier: BadgeTier;
    requirement: number; // The count needed to unlock this tier
}

export interface BadgeDefinition {
    id: string;
    category: BadgeCategory;
    titleKey: string; // Key for translation e.g. 'gamification.badges.prayer.time.title'
    descriptionKey: string;
    historyKey?: string; // Key for historical context/story
    icon: string; // Lucide icon name stored as string
    tiers: BadgeTierRequirement[];
    isTemplate?: boolean;
}

export interface UserBadge {
    badgeId: string;
    currentCount: number; // The user's current progress count
    unlockedTier: BadgeTier | null; // The highest tier unlocked
    isNew: boolean; // To trigger animations
    unlockedAt?: number; // Timestamp of last unlock
}

export interface LevelTier {
    level: number; // Min level to reach this tier
    minXp: number; // Min XP to reach this tier (approximate)
    nameKey: string; // Key for translation
    colorTheme: string; // Tailwind class string for text/border/bg
}
