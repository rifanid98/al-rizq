import { BadgeDefinition } from '../../../shared/types/gamification';

export const BADGES: BadgeDefinition[] = [
    // --- PRAYER BADGES ---
    {
        id: 'prayer_ontime',
        category: 'prayer',
        isTemplate: true,
        titleKey: 'badges.prayer.ontime.title',
        descriptionKey: 'badges.prayer.ontime.desc',
        historyKey: 'badges.prayer.ontime.history',
        icon: 'Clock',
        tiers: [
            { tier: 'bronze', requirement: 50 },
            { tier: 'silver', requirement: 250 },
            { tier: 'gold', requirement: 1000 },
        ]
    },
    {
        id: 'prayer_jamaah',
        category: 'prayer',
        isTemplate: true,
        titleKey: 'badges.prayer.jamaah.title',
        descriptionKey: 'badges.prayer.jamaah.desc',
        historyKey: 'badges.prayer.jamaah.history',
        icon: 'Users',
        tiers: [
            { tier: 'bronze', requirement: 50 },
            { tier: 'silver', requirement: 250 },
            { tier: 'gold', requirement: 1000 },
        ]
    },
    {
        id: 'prayer_mosque',
        category: 'prayer',
        isTemplate: true,
        titleKey: 'badges.prayer.mosque.title',
        descriptionKey: 'badges.prayer.mosque.desc',
        historyKey: 'badges.prayer.mosque.history',
        icon: 'Home',
        tiers: [
            { tier: 'bronze', requirement: 50 },
            { tier: 'silver', requirement: 250 },
            { tier: 'gold', requirement: 500 },
        ]
    },
    {
        id: 'prayer_sunnah',
        category: 'prayer',
        isTemplate: true,
        titleKey: 'badges.prayer.sunnah.title',
        descriptionKey: 'badges.prayer.sunnah.desc',
        historyKey: 'badges.prayer.sunnah.history',
        icon: 'Star',
        tiers: [
            { tier: 'bronze', requirement: 100 },
            { tier: 'silver', requirement: 500 },
            { tier: 'gold', requirement: 1000 },
        ]
    },
    {
        id: 'prayer_subuh',
        category: 'prayer',
        isTemplate: true,
        titleKey: 'badges.prayer.subuh.title',
        descriptionKey: 'badges.prayer.subuh.desc',
        historyKey: 'badges.prayer.subuh.history',
        icon: 'SunMedium',
        tiers: [
            { tier: 'bronze', requirement: 40 },
            { tier: 'silver', requirement: 100 },
            { tier: 'gold', requirement: 365 },
        ]
    },

    // --- FASTING BADGES ---
    {
        id: 'fasting_mon_thu',
        category: 'fasting',
        isTemplate: true,
        titleKey: 'badges.fasting.monthu.title',
        descriptionKey: 'badges.fasting.monthu.desc',
        historyKey: 'badges.fasting.monthu.history',
        icon: 'Calendar',
        tiers: [
            { tier: 'bronze', requirement: 4 },
            { tier: 'silver', requirement: 24 },
            { tier: 'gold', requirement: 48 },
        ]
    },
    {
        id: 'fasting_ayamul_bidh',
        category: 'fasting',
        isTemplate: true,
        titleKey: 'badges.fasting.ayyamul.title',
        descriptionKey: 'badges.fasting.ayyamul.desc',
        historyKey: 'badges.fasting.ayyamul.history',
        icon: 'Moon',
        tiers: [
            { tier: 'bronze', requirement: 3 },
            { tier: 'silver', requirement: 18 },
            { tier: 'gold', requirement: 36 },
        ]
    },
    {
        id: 'fasting_hero', // Ramadhan
        category: 'fasting',
        isTemplate: true,
        titleKey: 'badges.fasting.ramadhan.title',
        descriptionKey: 'badges.fasting.ramadhan.desc',
        historyKey: 'badges.fasting.ramadhan.history',
        icon: 'Award',
        tiers: [
            { tier: 'bronze', requirement: 1 },
            { tier: 'silver', requirement: 3 },
            { tier: 'gold', requirement: 5 },
        ]
    },
    {
        id: 'fasting_qadha',
        category: 'fasting',
        isTemplate: true,
        titleKey: 'badges.fasting.qadha.title',
        descriptionKey: 'badges.fasting.qadha.desc',
        historyKey: 'badges.fasting.qadha.history',
        icon: 'RotateCcw',
        tiers: [
            { tier: 'gold', requirement: 1 },
        ]
    },


    // --- DHIKR BADGES ---
    {
        id: 'dzikir_morning',
        category: 'dzikir',
        isTemplate: true,
        titleKey: 'badges.dzikir.morning.title',
        descriptionKey: 'badges.dzikir.morning.desc',
        historyKey: 'badges.dzikir.morning.history',
        icon: 'Sun',
        tiers: [
            { tier: 'bronze', requirement: 30 },
            { tier: 'silver', requirement: 90 },
            { tier: 'gold', requirement: 365 },
        ]
    },
    {
        id: 'dzikir_evening',
        category: 'dzikir',
        isTemplate: true,
        titleKey: 'badges.dzikir.evening.title',
        descriptionKey: 'badges.dzikir.evening.desc',
        historyKey: 'badges.dzikir.evening.history',
        icon: 'Sunset',
        tiers: [
            { tier: 'bronze', requirement: 30 },
            { tier: 'silver', requirement: 90 },
            { tier: 'gold', requirement: 365 },
        ]
    },

    // --- GENERAL BADGES ---
    {
        id: 'general_istiqomah',
        category: 'general',
        isTemplate: true,
        titleKey: 'badges.general.istiqomah.title',
        descriptionKey: 'badges.general.istiqomah.desc',
        historyKey: 'badges.general.istiqomah.history',
        icon: 'Flame',
        tiers: [
            { tier: 'bronze', requirement: 7 },
            { tier: 'silver', requirement: 30 },
            { tier: 'gold', requirement: 100 },
            { tier: 'diamond', requirement: 365 },
        ]
    }
];
