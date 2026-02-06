import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { BadgeIcon } from './BadgeAssets';
import { BadgeTier, UserBadge } from '../../../shared/types/gamification';
import { getBadgeDefinition } from '../services/badgeService';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { AnimatePresence, motion } from 'framer-motion';

// --- TYPES & CONSTANTS ---
interface BadgeUnlockModalProps {
    queue: UserBadge[];
    onPop: () => void;
    onClear: () => void;
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}

const tierLabels: Record<BadgeTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    diamond: 'Diamond'
};

const tierColors: Record<BadgeTier, { bg: string; text: string; glow: string }> = {
    bronze: {
        bg: 'from-amber-900/90 via-amber-800/80 to-amber-700/90',
        text: 'text-amber-300',
        glow: 'shadow-amber-500/50'
    },
    silver: {
        bg: 'from-slate-600/90 via-slate-500/80 to-slate-400/90',
        text: 'text-slate-200',
        glow: 'shadow-slate-400/50'
    },
    gold: {
        bg: 'from-yellow-700/90 via-yellow-600/80 to-yellow-500/90',
        text: 'text-yellow-200',
        glow: 'shadow-yellow-400/50'
    },
    diamond: {
        bg: 'from-cyan-700/90 via-cyan-600/80 to-cyan-400/90',
        text: 'text-cyan-200',
        glow: 'shadow-cyan-400/50'
    }
};

// --- HELPER ---
const getNestedTranslation = (t: any, path: string, badgeId?: string): string => {
    try {
        const keys = path.split('.');
        let current = t.gamification;
        for (const key of keys) {
            if (!current) return path;
            current = current[key];
        }
        if (typeof current !== 'string') return path;

        // Handle year replacement if available
        if (badgeId) {
            const match = badgeId.match(/_(\d{4})$/);
            if (match) {
                const year = match[1];
                if (current.includes('{year}')) {
                    return current.replace(/{year}/g, year);
                }
                if (path.includes('.title') && !current.includes(year)) {
                    return `${current} ${year}`;
                }
            }
        }
        return current;
    } catch {
        return path;
    }
};

// --- SUB-COMPONENT: BADGE CARD ---
const BadgeCard: React.FC<{
    badge: UserBadge;
    isDesktop: boolean;
    onClose?: () => void;
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}> = ({ badge, isDesktop, onClose, ramadhanConfig, qadhaConfig }) => {
    const { t } = useLanguage();
    const [isFlipped, setIsFlipped] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const def = getBadgeDefinition(badge.badgeId, ramadhanConfig, qadhaConfig);

    useEffect(() => {
        const flipTimer = setTimeout(() => {
            setIsFlipped(true);
            setShowConfetti(true);
        }, 500);

        const confettiTimer = setTimeout(() => setShowConfetti(false), 2500);

        return () => {
            clearTimeout(flipTimer);
            clearTimeout(confettiTimer);
        };
    }, []);

    if (!def) return null;

    const tier = badge.unlockedTier || 'bronze';
    const colors = tierColors[tier] || tierColors.bronze;
    const title = getNestedTranslation(t, def.titleKey, badge.badgeId);
    const desc = getNestedTranslation(t, def.descriptionKey, badge.badgeId);
    const history = def.historyKey ? getNestedTranslation(t, def.historyKey, badge.badgeId) : null;

    return (
        <div className="relative w-80 h-[480px] perspective-1000 group cursor-default">
            {showConfetti && (
                <div className="absolute inset-0 overflow-visible pointer-events-none z-50">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 1, y: 0, x: 0 }}
                            animate={{ opacity: 0, y: -100, x: (Math.random() - 0.5) * 100 }}
                            transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
                            className="absolute left-1/2 top-0"
                        >
                            <Sparkles
                                className={`w-4 h-4 ${['text-yellow-400', 'text-amber-300', 'text-cyan-400', 'text-pink-400', 'text-emerald-400'][i % 5]
                                    }`}
                            />
                        </motion.div>
                    ))}
                </div>
            )}

            <motion.div
                className="relative w-full h-full transform-style-3d transition-all duration-700"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' }}
                transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
            >
                {/* BACK */}
                <div
                    className={`absolute inset-0 w-full h-full rounded-2xl backface-hidden
                        bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900
                        border-2 border-slate-600
                        flex items-center justify-center
                        shadow-2xl
                    `}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-slate-700/50 rounded-2xl flex items-center justify-center animate-pulse">
                            <Sparkles className="w-12 h-12 text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                            {t.gamification?.badges?.unlocking || 'Unlocking...'}
                        </p>
                    </div>
                </div>

                {/* FRONT */}
                <div
                    className={`absolute inset-0 w-full h-full rounded-2xl backface-hidden rotate-y-180
                        bg-gradient-to-br ${colors.bg}
                        border-2 border-white/20
                        shadow-2xl ${colors.glow}
                        overflow-hidden
                    `}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    {!isDesktop && onClose && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="absolute top-3 right-3 z-10 p-1.5 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-white/70" />
                        </button>
                    )}

                    <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent pointer-events-none" />

                    <div className="relative h-full flex flex-col items-center justify-center p-5 text-center overflow-y-auto custom-scrollbar">
                        <div className={`mb-3 px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20`}>
                            <span className={`text-xs font-black uppercase tracking-widest ${colors.text}`}>
                                {tierLabels[tier]} {t.gamification?.badges?.tier || 'Tier'}
                            </span>
                        </div>

                        <div className="w-24 h-24 mb-4 drop-shadow-2xl hover:scale-110 transition-transform duration-300">
                            <BadgeIcon id={badge.badgeId} tier={tier} />
                        </div>

                        <h2 className="text-lg font-black text-white mb-1 drop-shadow-lg">
                            {String(title)}
                        </h2>

                        <p className="text-sm text-white/80 leading-relaxed mb-3">
                            {String(desc)}
                        </p>

                        {history && history !== def.historyKey && (
                            <div className="bg-black/20 rounded-2xl p-3 mb-3 border border-white/10">
                                <p className="text-xs text-white/70 italic leading-relaxed">
                                    "{String(history)}"
                                </p>
                            </div>
                        )}

                        <div className="mt-auto pt-2 flex items-center gap-2 text-white/90">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {t.gamification?.badges?.congratulations || 'Congratulations!'}
                            </span>
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- ANIMATION VARIANTS (Defined outside to ensure stability) ---

// Gets the flying target configuration
const getFlyTarget = () => {
    // Try to find the Achievements/Gamification entry point
    const desktopTarget = document.getElementById('nav-achievements-desktop');
    const mobileTarget = document.getElementById('mobile-gamification-trigger');
    const target = (window.innerWidth >= 1024) ? desktopTarget : mobileTarget;

    if (target) {
        const rect = target.getBoundingClientRect();
        return {
            x: rect.left + (rect.width / 2) - (window.innerWidth / 2),
            y: rect.top + (rect.height / 2) - (window.innerHeight / 2)
        };
    }

    // Fallback: Fly to Top-Right
    return {
        x: (window.innerWidth / 2) - 60,
        y: -(window.innerHeight / 2) + 60
    };
};

const cardFlyVariants = {
    initial: { opacity: 0, scale: 0.5, y: 100, rotateX: 45 },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0,
        rotateX: 0,
        transition: { type: "spring", stiffness: 200, damping: 20 }
    },
    exit: (customIsCollecting: boolean) => {
        if (customIsCollecting) {
            const target = getFlyTarget();
            return {
                opacity: 0,
                scale: 0.05, // Shrink to star size
                x: target.x,
                y: target.y,
                // Removed rotation as requested
                transition: { duration: 0.8, ease: [0.32, 0, 0.67, 0] } // EaseInCubic for "launch" feel
            };
        }

        // Standard Dismiss: Slide UP + Fade Out
        return {
            opacity: 0,
            scale: 0.9,
            y: -150, // More pronounced slide up
            transition: { duration: 0.3, ease: "easeIn" }
        };
    }
};

// --- VIEWS ---

const DesktopView: React.FC<{
    queue: UserBadge[];
    visibleCount: number;
    setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
    onCollect: () => void;
    isCollecting: boolean;
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}> = ({ queue, visibleCount, setVisibleCount, onCollect, isCollecting, ramadhanConfig, qadhaConfig }) => {
    const safeVisibleCount = Math.max(visibleCount, 0);
    // When collecting, force cards to be removed so AnimatePresence triggers the exit variant
    const visibleCards = isCollecting ? [] : queue.slice(0, safeVisibleCount);
    const hasMore = visibleCount < queue.length;

    return (
        <motion.div
            key="desktop-root"
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.6 } }} // Fade out AFTER cards fly
        >
            <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                onClick={hasMore ? () => setVisibleCount(p => p + 1) : undefined}
            />

            <div className="relative z-10 flex items-center justify-center gap-4 w-full px-10 h-[600px] pointer-events-none">
                <AnimatePresence mode="popLayout" custom={isCollecting}>
                    {visibleCards.map((badge, index) => (
                        <motion.div
                            key={badge.badgeId + (badge.unlockedTier || '')}
                            layout
                            custom={isCollecting}
                            variants={cardFlyVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="pointer-events-auto relative"
                            style={{
                                perspective: '1000px',
                                zIndex: visibleCards.length - index
                            }}
                        >
                            <BadgeCard badge={badge} isDesktop={true} ramadhanConfig={ramadhanConfig} qadhaConfig={qadhaConfig} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <motion.div
                className="absolute bottom-10 z-20 flex flex-col items-center gap-4 pointer-events-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
            >
                <div className="text-white/50 text-sm font-medium mb-2">
                    {queue.length > 1 ? `${queue.length} Rewards Unlocked!` : 'New Reward Unlocked!'}
                </div>

                <AnimatePresence mode="wait">
                    {hasMore ? (
                        <motion.button
                            key="next-btn"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setVisibleCount(p => p + 1)}
                            className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:bg-slate-50 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center gap-2"
                        >
                            <span>Reveal Next</span>
                            <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-xs ml-1">
                                {queue.length - visibleCount} left
                            </span>
                        </motion.button>
                    ) : (
                        <motion.button
                            key="collect-btn"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            onClick={onCollect}
                            disabled={isCollecting}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold shadow-xl shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center gap-2 group"
                        >
                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span>Collect All Rewards</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

const MobileView: React.FC<{
    queue: UserBadge[];
    onPop: () => void;
    ramadhanConfig?: { startDate: string, endDate: string };
    qadhaConfig?: { customDates: string[] };
}> = ({ queue, onPop, ramadhanConfig, qadhaConfig }) => {
    const currentBadge = queue[0];

    // Explicit container variants to manage exit timing
    const containerVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: {
            opacity: 0,
            transition: {
                when: "afterChildren", // CRITICAL: Wait for card to exit first
                duration: 0.2
            }
        }
    };

    return (
        <motion.div
            key="mobile-root"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} // Fades out with container
                onClick={onPop}
            />

            <div className="relative z-10 w-auto h-auto pointer-events-none">
                <AnimatePresence mode="wait">
                    {currentBadge && (
                        <motion.div
                            key={currentBadge.badgeId + (currentBadge.unlockedTier || '')}
                            variants={cardFlyVariants}
                            custom={false}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="pointer-events-auto"
                            style={{ perspective: '1000px' }}
                        >
                            <BadgeCard
                                badge={currentBadge}
                                isDesktop={false}
                                onClose={onPop}
                                ramadhanConfig={ramadhanConfig}
                                qadhaConfig={qadhaConfig}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// --- MAIN WRAPPER ---
export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ queue, onPop, onClear, ramadhanConfig, qadhaConfig }) => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    const [desktopVisibleCount, setDesktopVisibleCount] = useState(0);
    const [isCollecting, setIsCollecting] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (queue.length === 0) {
            setDesktopVisibleCount(0);
            setIsCollecting(false);
        } else if (desktopVisibleCount === 0) {
            setDesktopVisibleCount(1);
        }
    }, [queue.length]);

    const handleCollect = () => {
        setIsCollecting(true);
        // Delay clearing to allow 'isCollecting' state to trigger exit animation components
        setTimeout(() => {
            onClear();
        }, 900);
    };

    return (
        <AnimatePresence mode="wait">
            {queue.length > 0 && (
                isDesktop ? (
                    <DesktopView
                        key="desktop"
                        queue={queue}
                        visibleCount={desktopVisibleCount}
                        setVisibleCount={setDesktopVisibleCount}
                        onCollect={handleCollect}
                        isCollecting={isCollecting}
                        ramadhanConfig={ramadhanConfig}
                        qadhaConfig={qadhaConfig}
                    />
                ) : (
                    <MobileView
                        key="mobile"
                        queue={queue}
                        onPop={onPop}
                        ramadhanConfig={ramadhanConfig}
                        qadhaConfig={qadhaConfig}
                    />
                )
            )}
        </AnimatePresence>
    );
};

export default BadgeUnlockModal;
