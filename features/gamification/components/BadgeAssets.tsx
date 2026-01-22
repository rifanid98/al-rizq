import React from 'react';

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond' | undefined;

interface BadgeIconProps {
    id: string;
    tier?: BadgeTier;
    className?: string;
}

const getTierColors = (tier: BadgeTier) => {
    switch (tier) {
        case 'bronze': return {
            main: '#CD7F32',
            light: '#E6A368',
            dark: '#8B4513',
        };
        case 'silver': return {
            main: '#C0C0C0',
            light: '#E8E8E8',
            dark: '#808080',
        };
        case 'gold': return {
            main: '#FFD700',
            light: '#FFFACD',
            dark: '#DAA520',
        };
        case 'diamond': return {
            main: '#00FFFF',
            light: '#E0FFFF',
            dark: '#008B8B',
        };
        default: return { // LOCKED (Gray/Slate)
            main: '#94A3B8',
            light: '#CBD5E1',
            dark: '#475569',
        };
    }
};

const getBadgeTheme = (id: string, tier: BadgeTier) => {
    // If locked, return grayscale/slate theme
    if (!tier) return { start: '#1E293B', end: '#334155' };

    if (id.startsWith('prayer')) {
        if (id.includes('subuh')) return { start: '#0F172A', end: '#F472B6' }; // Dawn
        if (id.includes('sunnah')) return { start: '#0EA5E9', end: '#FBBF24' }; // Sky to Sun
        if (id.includes('mosque')) return { start: '#047857', end: '#10B981' }; // Emerald Green
        if (id.includes('jamaah')) return { start: '#B45309', end: '#FCD34D' }; // Community/Warm
        return { start: '#0284C7', end: '#38BDF8' }; // Default Sky Blue
    }
    if (id.startsWith('fasting')) {
        if (id.includes('hero')) return { start: '#312E81', end: '#A855F7' }; // Deep Night Purple (Ramadhan)
        if (id.includes('qadha')) return { start: '#BE185D', end: '#F472B6' }; // Pink
        if (id.includes('monthu')) return { start: '#1E1B4B', end: '#6366F1' }; // Deep Indigo
        return { start: '#312E81', end: '#818CF8' }; // Indigo
    }
    if (id.startsWith('dzikir')) {
        if (id.includes('morning')) return { start: '#D97706', end: '#FDE047' }; // Amber Sunrise
        return { start: '#4338CA', end: '#818CF8' }; // Evening Indigo
    }
    // General / Istiqomah
    return { start: '#9F1239', end: '#F43F5E' }; // Rose Fire
};

const BadgeBase = ({ id, tier, children }: { id: string, tier: BadgeTier, children: React.ReactNode }) => {
    const colors = getTierColors(tier);
    const theme = getBadgeTheme(id, tier);
    const uniqueId = React.useId();

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md text-white">
            <defs>
                {/* Border/Frame Gradient (Tier-based) */}
                <linearGradient id={`frame-grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.light} />
                    <stop offset="50%" stopColor={colors.main} />
                    <stop offset="100%" stopColor={colors.dark} />
                </linearGradient>

                {/* Inner Background Gradient (Theme-based) */}
                <linearGradient id={`bg-grad-${uniqueId}`} x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={theme.start} />
                    <stop offset="100%" stopColor={theme.end} />
                </linearGradient>

                <filter id={`shadow-${uniqueId}`}>
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
                </filter>
            </defs>

            {/* Outer Frame (Octagon) */}
            <path
                d="M50 2 L88 18 L98 55 L88 92 L50 98 L12 92 L2 55 L12 18 Z"
                fill={`url(#frame-grad-${uniqueId})`}
                stroke={colors.dark}
                strokeWidth="1"
            />

            {/* Inner Background (Thematic) */}
            <path
                d="M50 8 L82 21 L90 53 L82 85 L50 92 L18 85 L10 53 L18 21 Z"
                fill={`url(#bg-grad-${uniqueId})`}
                opacity={tier ? 1 : 0.8}
            />

            {/* Inner Icon Container */}
            <g transform="translate(25, 25) scale(0.5)" fill="white" filter={`url(#shadow-${uniqueId})`}>
                {children}
            </g>

            {/* Glass Shine Reflection */}
            <path d="M50 8 L82 21 L50 50 Z" fill="white" opacity="0.2" />
            <path d="M18 21 L50 8 L50 50 Z" fill="white" opacity="0.1" />
        </svg>
    );
};

// --- ICON PATHS ---

const Icons: Record<string, React.ReactNode> = {
    // 1. Prayer OnTime (Running Figure / Clock combination)
    'prayer_ontime': (
        <path d="M50 10 A40 40 0 1 0 90 50 A40 40 0 0 0 50 10 Z M50 20 A30 30 0 1 1 20 50 A30 30 0 0 1 50 20 Z M45 30 L45 50 L65 65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
    ),
    // 2. Prayer Jamaah (Group of People)
    'prayer_jamaah': (
        <g>
            <circle cx="50" cy="35" r="15" fill="currentColor" />
            <path d="M20 90 Q50 70 80 90 V100 H20 Z" fill="currentColor" />
            <circle cx="85" cy="45" r="10" fill="currentColor" opacity="0.7" />
            <circle cx="15" cy="45" r="10" fill="currentColor" opacity="0.7" />
        </g>
    ),
    // 3. Prayer Mosque (Mosque Dome)
    'prayer_mosque': (
        <path d="M10 90 H90 V60 H80 V40 C80 20 65 10 50 5 C35 10 20 20 20 40 V60 H10 Z M40 90 V70 A10 10 0 0 1 60 70 V90" fill="currentColor" />
    ),
    // 4. Prayer Sunnah (Sun/Star)
    'prayer_sunnah': (
        <path d="M50 5 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill="currentColor" />
    ),
    // 5. Prayer Subuh (Horizon Sun)
    'prayer_subuh': (
        <g>
            <path d="M10 70 H90" stroke="currentColor" strokeWidth="5" />
            <path d="M20 70 A30 30 0 0 1 80 70" fill="currentColor" />
            <path d="M50 10 V30 M20 25 L30 35 M80 25 L70 35" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </g>
    ),
    // 6. Fasting Mon Thu (Two Pillars / 1 & 4)
    'fasting_mon_thu': (
        <g>
            <rect x="15" y="20" width="30" height="60" rx="5" fill="currentColor" />
            <rect x="55" y="20" width="30" height="60" rx="5" fill="currentColor" fillOpacity="0.7" />
            <text x="30" y="65" fontSize="40" fill="black" textAnchor="middle" fontWeight="bold">1</text>
            <text x="70" y="65" fontSize="40" fill="black" textAnchor="middle" fontWeight="bold">4</text>
        </g>
    ),
    // 7. Fasting Ayyamul Bidh (Full Moon phases)
    'fasting_ayamul_bidh': (
        <g>
            <circle cx="50" cy="50" r="30" fill="currentColor" />
            <circle cx="85" cy="20" r="5" fill="currentColor" />
            <circle cx="20" cy="80" r="3" fill="currentColor" />
        </g>
    ),
    // 8. Ramadhan Hero (Lantern/Fanoos)
    'fasting_hero': (
        <path d="M50 10 L70 30 L60 80 L50 90 L40 80 L30 30 Z M50 10 V5" fill="currentColor" />
    ),
    // 9. Fasting Qadha (Debt Slayer / Balance)
    'fasting_qadha_annual': (
        <g>
            <path d="M50 10 V40 M20 40 H80 M20 40 L10 70 H30 L20 40 M80 40 L70 70 H90 L80 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M10 70 A10 5 0 0 0 30 70" fill="currentColor" opacity="0.5" />
            <path d="M70 70 A10 5 0 0 0 90 70" fill="currentColor" opacity="0.5" />
        </g>
    ),
    // 10. Dzikir Morning (Rising Sun + Beads)
    'dzikir_morning': (
        <g>
            <path d="M10 60 Q50 10 90 60" fill="none" stroke="currentColor" strokeWidth="5" />
            <circle cx="50" cy="35" r="10" fill="currentColor" />
            {/* Rays */}
            <path d="M50 10 V20 M20 20 L28 28 M80 20 L72 28" stroke="currentColor" strokeWidth="3" />
        </g>
    ),
    // 11. Dzikir Evening (Moon + Beads)
    'dzikir_evening': (
        <g>
            <path d="M60 20 A30 30 0 1 1 40 70 A25 25 0 1 0 60 20" fill="currentColor" />
            <circle cx="80" cy="30" r="3" fill="currentColor" />
            <circle cx="70" cy="15" r="2" fill="currentColor" />
        </g>
    ),
    // 12. General Istiqomah (Flame/Torch)
    'general_istiqomah': (
        <path d="M50 90 Q30 70 30 50 Q30 20 50 10 Q70 20 70 50 Q70 70 50 90 Z M50 90 V70" fill="currentColor" />
    )
};

const DefaultIcon = (
    <path d="M50 20 L80 50 L50 80 L20 50 Z" fill="currentColor" />
);

// --- DYNAMIC ICON RENDERER ---
// --- DYNAMIC ICON RENDERER ---
const getIconContent = (id: string, tier?: BadgeTier) => {
    // Dynamic Qadha Badges need special handling to render year text
    if (id.startsWith('fasting_qadha_')) {
        const year = id.split('_').pop();
        return (
            <g>
                <g transform="translate(0, -10)">
                    <path d="M50 10 V40 M20 40 H80 M20 40 L10 70 H30 L20 40 M80 40 L70 70 H90 L80 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M10 70 A10 5 0 0 0 30 70" fill="currentColor" opacity="0.5" />
                    <path d="M70 70 A10 5 0 0 0 90 70" fill="currentColor" opacity="0.5" />
                </g>
                <text x="50" y="90" fontSize="28" fill="currentColor" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">
                    {year}
                </text>
            </g>
        );
    }

    // For other yearly badges, strip the year suffix to find the base icon
    const match = id.match(/^(.+)_(\d{4})$/);
    if (match) {
        const baseId = match[1];
        return Icons[baseId] || DefaultIcon;
    }

    return Icons[id] || DefaultIcon;
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({ id, tier, className }) => {
    return (
        <div className={`aspect-square ${className || 'w-full h-full'}`}>
            <BadgeBase id={id} tier={tier}>
                {getIconContent(id, tier)}
            </BadgeBase>
        </div>
    );
};
