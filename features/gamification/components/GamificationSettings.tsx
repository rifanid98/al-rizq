
import React from 'react';
import { GamificationConfig, DEFAULT_GAMIFICATION_CONFIG, SecurityConfig } from '../../../shared/types';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { Star, ChevronDown, Utensils, Sparkles, Sun, Heart, Settings, Lock, Unlock } from 'lucide-react';
import { PinLock } from '../../../shared/components/ui/PinLock';

interface GamificationSettingsProps {
    config: GamificationConfig;
    onChange: (config: GamificationConfig) => void;
    security?: SecurityConfig;
}

export const GamificationSettings: React.FC<GamificationSettingsProps> = ({ config, onChange, security }) => {
    const { t } = useLanguage();
    const [openSection, setOpenSection] = React.useState<string | null>(null);
    const [openSubSection, setOpenSubSection] = React.useState<string | null>(null);
    const [isUnlocked, setIsUnlocked] = React.useState(false);
    const [showPinEntry, setShowPinEntry] = React.useState(false);

    const isLocked = security?.isPinEnabled && !isUnlocked;

    const handleChange = (section: keyof GamificationConfig['points'], key: string, value: number) => {
        const newConfig = {
            ...config,
            points: {
                ...config.points,
                [section]: {
                    ...(config.points[section] || DEFAULT_GAMIFICATION_CONFIG.points[section]),
                    [key]: isNaN(value) ? 0 : value
                }
            }
        };
        onChange(newConfig);
    };

    const handleToggle = (enabled: boolean) => {
        onChange({ ...config, enabled });
    };

    const getKeyName = (key: string) => {
        return (t.gamification.settings.keys as any)[key] || key.replace(/([A-Z])/g, ' $1').trim();
    };

    const toggleAccordion = (section: string) => {
        if (section === 'points' && isLocked) {
            setShowPinEntry(true);
            return;
        }

        // If we are closing the points section, lock it back
        if (section === 'points' && openSection === 'points') {
            setIsUnlocked(false);
        }

        setOpenSection(openSection === section ? null : section);
    };

    const toggleSubAccordion = (section: string) => {
        setOpenSubSection(openSubSection === section ? null : section);
    };

    const renderPointsSection = (
        sectionKey: keyof GamificationConfig['points'],
        title: string,
        icon: React.ReactNode,
        iconBgColor: string,
        focusColor: string,
        gridCols: string = 'grid-cols-2'
    ) => {
        // Merge saved config with defaults to ensure all keys are present
        const defaultSection = DEFAULT_GAMIFICATION_CONFIG.points[sectionKey];
        const savedSection = config.points[sectionKey];
        const sectionData = defaultSection ? { ...defaultSection, ...savedSection } : savedSection;
        if (!sectionData) return null;

        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                    onClick={() => toggleSubAccordion(sectionKey)}
                    className="w-full flex items-center justify-between p-3 text-left font-bold text-slate-700 dark:text-slate-200"
                >
                    <span className="flex items-center gap-3 text-xs uppercase tracking-wider">
                        <div className={`w-7 h-7 ${iconBgColor} rounded-2xl flex items-center justify-center shrink-0`}>
                            {icon}
                        </div>
                        {title}
                    </span>
                    <ChevronDown className={`w-4 h-4 mr-1 text-slate-400 transition-transform ${openSubSection === sectionKey ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ${openSubSection === sectionKey ? 'max-h-[800px] border-t border-slate-100 dark:border-slate-700 p-4' : 'max-h-0 overflow-hidden'}`}>
                    <div className={`grid ${gridCols} gap-3`}>
                        {Object.keys(sectionData).map((key) => (
                            <div key={key} className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-slate-500 capitalize">{getKeyName(key)}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={(sectionData as any)[key]}
                                        onChange={(e) => handleChange(sectionKey, key, parseInt(e.target.value))}
                                        className={`w-full px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold ${focusColor} outline-none transition-all`}
                                    />
                                    <span className="text-[10px] font-black text-amber-500">{t.gamification.settings.pts}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {showPinEntry && security && (
                <PinLock
                    savedPin={security.pin}
                    onSuccess={() => {
                        setIsUnlocked(true);
                        setShowPinEntry(false);
                        setOpenSection('points');
                    }}
                    onCancel={() => setShowPinEntry(false)}
                    title={t.settings.security.pinRequired}
                    description={t.settings.security.unlockToEdit}
                />
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center text-amber-600">
                        <Star className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                            {t.gamification.settings.title}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {config.enabled ? t.gamification.settings.active : t.gamification.settings.disabled}
                        </p>
                    </div>
                </div>
                <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    onClick={() => handleToggle(!config.enabled)}
                    style={{ backgroundColor: config.enabled ? '#10b981' : '#9ca3af' }}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {config.enabled && (
                <div className="space-y-3 pt-2">
                    {/* Points Configuration Parent Accordion */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                        <button
                            onClick={() => toggleAccordion('points')}
                            className="w-full flex items-center justify-between p-3 text-left font-bold text-slate-700 dark:text-slate-200"
                        >
                            <span className="flex items-center gap-3 text-xs uppercase tracking-wider">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-amber-950/50 dark:to-emerald-950/50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                                    <Settings className="w-4 h-4" />
                                </div>
                                {t.gamification?.settings?.pointsConfig || 'Points Configuration'}
                                {security?.isPinEnabled && (
                                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${isUnlocked ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {isUnlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                        {isUnlocked ? t.settings.security.correctPin : t.settings.security.pinLocked}
                                    </span>
                                )}
                            </span>
                            <ChevronDown className={`w-4 h-4 mr-1 text-slate-400 transition-transform ${openSection === 'points' ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-300 ${openSection === 'points' ? 'max-h-[2000px] border-t border-slate-100 dark:border-slate-700 p-3' : 'max-h-0 overflow-hidden'}`}>
                            <div className="space-y-2">
                                {renderPointsSection(
                                    'prayer',
                                    t.gamification.settings.pointsPrayer,
                                    <Star className="w-3.5 h-3.5 text-amber-600" />,
                                    'bg-amber-100 dark:bg-amber-950/50',
                                    'focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500',
                                    'grid-cols-3 max-[574px]:grid-cols-2'
                                )}
                                {renderPointsSection(
                                    'fasting',
                                    t.gamification.settings.pointsFasting,
                                    <Utensils className="w-3.5 h-3.5 text-emerald-600" />,
                                    'bg-emerald-100 dark:bg-emerald-950/50',
                                    'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                                )}
                                {renderPointsSection(
                                    'dzikir',
                                    t.gamification.settings.pointsDzikir,
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
                                    'bg-indigo-100 dark:bg-indigo-950/50',
                                    'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                )}
                                {renderPointsSection(
                                    'sunnahPrayer',
                                    t.gamification?.settings?.pointsSunnahPrayer || 'Sunnah Prayer Points',
                                    <Sun className="w-3.5 h-3.5 text-amber-600" />,
                                    'bg-amber-100 dark:bg-amber-950/50',
                                    'focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                )}
                                {renderPointsSection(
                                    'dailyHabit',
                                    t.gamification?.settings?.pointsDailyHabit || 'Daily Habit Points',
                                    <Heart className="w-3.5 h-3.5 text-rose-600" />,
                                    'bg-rose-100 dark:bg-rose-950/50',
                                    'focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
