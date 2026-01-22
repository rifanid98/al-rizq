import React, { useEffect, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useStarAnimation } from '../context/GamificationContext';

const BURST_DURATION = 600;
const FLY_DURATION = 1500;

interface SingleStarProps {
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    onComplete: () => void;
}

const SingleStar: React.FC<SingleStarProps> = ({ startX, startY, targetX, targetY, onComplete }) => {
    // Generate random burst offset once
    const burstOffset = useMemo(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 100; // 80-180px burst radius
        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance
        };
    }, []);

    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        left: startX,
        top: startY,
        transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
        opacity: 0,
        zIndex: 9999,
        transition: 'none',
    });

    const animationConfig = useMemo(() => {
        // Add tiny variation so they don't look like a single clump when many
        return {
            burstDuration: BURST_DURATION + (Math.random() * 200 - 100),
            flyDuration: FLY_DURATION + (Math.random() * 400 - 200),
            flyDelay: Math.random() * 150 // staggered start for the flight
        };
    }, []);

    useEffect(() => {
        // Phase 1: Burst OUT from start position
        const timer1 = setTimeout(() => {
            setStyle({
                position: 'fixed',
                left: startX + burstOffset.x,
                top: startY + burstOffset.y,
                transform: `translate(-50%, -50%) scale(1.2) rotate(${Math.random() * 360}deg)`,
                opacity: 1,
                zIndex: 9999,
                transition: `all ${animationConfig.burstDuration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
            });
        }, 50);

        // Phase 2: Fly to target
        const timer2 = setTimeout(() => {
            setStyle(prev => ({
                ...prev,
                left: targetX,
                top: targetY,
                transform: `translate(-50%, -50%) scale(0.2) rotate(${720 + Math.random() * 360}deg)`,
                opacity: 0.8,
                transition: `all ${animationConfig.flyDuration}ms cubic-bezier(0.5, 0, 0.2, 1)`,
            }));
        }, 50 + animationConfig.burstDuration + animationConfig.flyDelay);

        // Cleanup
        const timer3 = setTimeout(onComplete, 50 + animationConfig.burstDuration + animationConfig.flyDelay + animationConfig.flyDuration + 100);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [startX, startY, targetX, targetY, burstOffset, onComplete]);

    return (
        <div style={style} className="pointer-events-none text-amber-500 dark:text-amber-400 drop-shadow-md">
            <Star fill="currentColor" className="w-5 h-5" />
        </div>
    );
};

export const StarAnimationLayer: React.FC = () => {
    const { animations, removeAnimation } = useStarAnimation();

    return (
        <>
            {animations.map(anim => (
                <div key={anim.id}>
                    {Array.from({ length: anim.count }).map((_, i) => (
                        <SingleStar
                            key={`${anim.id}-${i}`}
                            startX={anim.startX}
                            startY={anim.startY}
                            targetX={anim.targetX}
                            targetY={anim.targetY}
                            onComplete={() => {
                                // Only trigger remove on the last star (approximate since they are parallel now)
                                if (i === anim.count - 1) {
                                    // Give a small buffer for all parallel animations to finish
                                    setTimeout(() => removeAnimation(anim.id), 100);
                                }
                            }}
                        />
                    ))}
                </div>
            ))}
        </>
    );
};
