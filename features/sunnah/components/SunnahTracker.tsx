
import React, { useState } from 'react';
import { Book, Sun, Heart } from 'lucide-react';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { DzikirTracker } from '../../dzikir/components/DzikirTracker';
import { SunnahPrayerTracker } from './SunnahPrayerTracker';
import { DailyHabitTracker } from './DailyHabitTracker';
import { GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../../../shared/types';

interface SunnahTrackerProps {
    gamificationConfig: GamificationConfig;
}

type SunnahTab = 'dzikir' | 'prayer' | 'habit';

export const SunnahTracker: React.FC<SunnahTrackerProps> = ({
    gamificationConfig = DEFAULT_GAMIFICATION_CONFIG
}) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<SunnahTab>('dzikir');

    const tabs: { id: SunnahTab; label: string; icon: React.ReactNode }[] = [
        { id: 'dzikir', label: t.sunnah?.tabs?.dzikir || 'Dzikir', icon: <Book className="w-4 h-4" /> },
        { id: 'prayer', label: t.sunnah?.tabs?.prayer || 'Shalat', icon: <Sun className="w-4 h-4" /> },
        { id: 'habit', label: t.sunnah?.tabs?.habit || 'Ibadah', icon: <Heart className="w-4 h-4" /> },
    ];

    return (
        <div
            id="v-sunnah-tracker"
            className="flex flex-col gap-4"
        >
            {/* Sub-tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden xs:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'dzikir' && (
                    <DzikirTracker gamificationConfig={gamificationConfig} />
                )}
                {activeTab === 'prayer' && (
                    <SunnahPrayerTracker gamificationConfig={gamificationConfig} />
                )}
                {activeTab === 'habit' && (
                    <DailyHabitTracker gamificationConfig={gamificationConfig} />
                )}
            </div>
        </div>
    );
};
