
import React, { useEffect, useState } from 'react';
import { Star, Trophy, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../shared/hooks/useLanguage';

interface GamificationStatsProps {
    level: number;
    progress: number;
    totalPoints: number;
    nextLevelXp: number;
    currentLevelXp: number;
}

export const GamificationStats: React.FC<GamificationStatsProps> = ({
    level,
    progress,
    totalPoints,
    nextLevelXp,
    currentLevelXp
}) => {
    const { t } = useLanguage();
    const [displayedPoints, setDisplayedPoints] = useState(0);

    // Animate points counting up
    useEffect(() => {
        const duration = 1500;
        const steps = 60;
        const increment = totalPoints / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= totalPoints) {
                current = totalPoints;
                clearInterval(timer);
            }
            setDisplayedPoints(Math.floor(current));
        }, duration / steps);
        return () => clearInterval(timer);
    }, [totalPoints]);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-lg shadow-amber-500/20 mb-6">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
                <Star className="w-64 h-64 fill-current" />
            </div>
            <div className="absolute bottom-0 left-0 p-4 opacity-10 transform -translate-x-1/3 translate-y-1/3 pointer-events-none">
                <Trophy className="w-48 h-48 fill-current" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left: Level & Progress */}
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{t.gamification.level} {level}</p>
                            <h3 className="text-xl font-black tracking-tight">{t.gamification.rank.novice}</h3>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/90 mb-1">
                            <span>{t.gamification.xp}</span>
                            <span>{Math.floor(currentLevelXp)} / {nextLevelXp}</span>
                        </div>
                        <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-white transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/50 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Star Points */}
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 shadow-inner">
                    <div className="relative">
                        <Star className="w-12 h-12 text-yellow-200 fill-yellow-200 animate-pulse drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]" />
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-white animate-bounce" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{t.gamification.totalPoints}</p>
                        <p className="text-4xl font-black tabular-nums tracking-tighter drop-shadow-md">
                            {displayedPoints.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
