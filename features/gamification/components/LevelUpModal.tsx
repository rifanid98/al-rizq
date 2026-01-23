import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GamificationStats } from './GamificationStats';
import { LevelTier } from '../../../shared/types/gamification';

interface LevelUpModalProps {
    show: boolean;
    onClose: () => void;
    gamification: {
        level: number;
        progress: number;
        totalPoints: number;
        nextThreshold: number;
        currentLevelThreshold: number;
        pointsInLevel: number;
        pointsNeededForLevel: number;
        levelName?: string;
        levelTier?: LevelTier;
    };
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ show, onClose, gamification }) => {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Card content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg z-10"
                    >
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={onClose}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-lg animate-pulse">
                                LEVEL UP!
                            </h2>
                        </div>

                        <GamificationStats
                            level={gamification.level}
                            progress={gamification.progress}
                            totalPoints={gamification.totalPoints}
                            nextThreshold={gamification.nextThreshold}
                            currentLevelThreshold={gamification.currentLevelThreshold}
                            pointsInLevel={gamification.pointsInLevel}
                            pointsNeededForLevel={gamification.pointsNeededForLevel}
                            levelName={gamification.levelName}
                            levelTier={gamification.levelTier}
                            readOnly={true}
                            minimal={true}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
