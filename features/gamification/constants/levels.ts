import { LevelTier } from '../../../shared/types/gamification';

export const LEVEL_TIERS: LevelTier[] = [
    {
        level: 1,
        minXp: 0,
        nameKey: 'levels.muslim',
        colorTheme: 'slate'
    },
    {
        level: 10,
        minXp: 5000,
        nameKey: 'levels.mukmin',
        colorTheme: 'emerald'
    },
    {
        level: 25,
        minXp: 12500,
        nameKey: 'levels.muhsin',
        colorTheme: 'cyan'
    },
    {
        level: 50,
        minXp: 25000,
        nameKey: 'levels.muttaqin',
        colorTheme: 'amber'
    },
    {
        level: 100,
        minXp: 50000,
        nameKey: 'levels.siddiq',
        colorTheme: 'violet'
    }
];

export const getTierByLevel = (level: number): LevelTier => {
    const reversed = [...LEVEL_TIERS].reverse();
    const tier = reversed.find(t => t.level <= level);
    return tier || LEVEL_TIERS[0];
};

export const getTierColorClass = (theme: string, type: 'text' | 'bg' | 'border' | 'ring'): string => {
    switch (theme) {
        case 'emerald':
            if (type === 'text') return 'text-emerald-600 dark:text-emerald-400';
            if (type === 'bg') return 'bg-emerald-50 dark:bg-emerald-950/30';
            if (type === 'border') return 'border-emerald-200 dark:border-emerald-800';
            if (type === 'ring') return 'ring-emerald-500/20';
            break;
        case 'cyan':
            if (type === 'text') return 'text-cyan-600 dark:text-cyan-400';
            if (type === 'bg') return 'bg-cyan-50 dark:bg-cyan-950/30';
            if (type === 'border') return 'border-cyan-200 dark:border-cyan-800';
            if (type === 'ring') return 'ring-cyan-500/20';
            break;
        case 'amber':
            if (type === 'text') return 'text-amber-600 dark:text-amber-400';
            if (type === 'bg') return 'bg-amber-50 dark:bg-amber-950/30';
            if (type === 'border') return 'border-amber-200 dark:border-amber-800';
            if (type === 'ring') return 'ring-amber-500/20';
            break;
        case 'violet':
            if (type === 'text') return 'text-violet-600 dark:text-violet-400';
            if (type === 'bg') return 'bg-violet-50 dark:bg-violet-950/30';
            if (type === 'border') return 'border-violet-200 dark:border-violet-800';
            if (type === 'ring') return 'ring-violet-500/20';
            break;
        default: // slate
            if (type === 'text') return 'text-slate-600 dark:text-slate-400';
            if (type === 'bg') return 'bg-slate-50 dark:bg-slate-800/50';
            if (type === 'border') return 'border-slate-200 dark:border-slate-700';
            if (type === 'ring') return 'ring-slate-500/20';
    }
    return '';
};
