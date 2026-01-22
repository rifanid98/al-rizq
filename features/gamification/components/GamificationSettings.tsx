
import React from 'react';
import { GamificationConfig } from '../../../shared/types';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { Star, ChevronDown, Utensils, Sparkles } from 'lucide-react';

interface GamificationSettingsProps {
    config: GamificationConfig;
    onChange: (config: GamificationConfig) => void;
}

export const GamificationSettings: React.FC<GamificationSettingsProps> = ({ config, onChange }) => {
    const { t } = useLanguage();
    const [openSection, setOpenSection] = React.useState<string | null>(null);

    const handleChange = (section: keyof GamificationConfig['points'], key: string, value: number) => {
        const newConfig = {
            ...config,
            points: {
                ...config.points,
                [section]: {
                    ...config.points[section],
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
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="space-y-6">
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
                    {/* Prayer Points Accordion */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => toggleAccordion('prayer')}
                            className="w-full flex items-center justify-between p-3 text-left font-bold text-slate-700 dark:text-slate-200"
                        >
                            <span className="flex items-center gap-3 text-xs uppercase tracking-wider">
                                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                    <Star className="w-4 h-4" />
                                </div>
                                {t.gamification.settings.pointsPrayer}
                            </span>
                            <ChevronDown className={`w-4 h-4 mr-1 text-slate-400 transition-transform ${openSection === 'prayer' ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-300 ${openSection === 'prayer' ? 'max-h-[800px] border-t border-slate-100 dark:border-slate-700 p-5' : 'max-h-0 overflow-hidden'}`}>
                            <div className="grid grid-cols-3 max-[574px]:grid-cols-2 gap-4">
                                {Object.keys(config.points.prayer).map((key) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 capitalize">{getKeyName(key)}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={(config.points.prayer as any)[key]}
                                                onChange={(e) => handleChange('prayer', key, parseInt(e.target.value))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                            />
                                            <span className="text-xs font-black text-amber-500">{t.gamification.settings.pts}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Fasting Points Accordion */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => toggleAccordion('fasting')}
                            className="w-full flex items-center justify-between p-3 text-left font-bold text-slate-700 dark:text-slate-200"
                        >
                            <span className="flex items-center gap-3 text-xs uppercase tracking-wider">
                                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                                    <Utensils className="w-4 h-4" />
                                </div>
                                {t.gamification.settings.pointsFasting}
                            </span>
                            <ChevronDown className={`w-4 h-4 mr-1 text-slate-400 transition-transform ${openSection === 'fasting' ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-300 ${openSection === 'fasting' ? 'max-h-[500px] border-t border-slate-100 dark:border-slate-700 p-5' : 'max-h-0 overflow-hidden'}`}>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(config.points.fasting).map((key) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 capitalize">{getKeyName(key)}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={(config.points.fasting as any)[key]}
                                                onChange={(e) => handleChange('fasting', key, parseInt(e.target.value))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                            <span className="text-xs font-black text-amber-500">{t.gamification.settings.pts}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dzikir Points Accordion */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => toggleAccordion('dzikir')}
                            className="w-full flex items-center justify-between p-3 text-left font-bold text-slate-700 dark:text-slate-200"
                        >
                            <span className="flex items-center gap-3 text-xs uppercase tracking-wider">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                {t.gamification.settings.pointsDzikir}
                            </span>
                            <ChevronDown className={`w-4 h-4 mr-1 text-slate-400 transition-transform ${openSection === 'dzikir' ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-300 ${openSection === 'dzikir' ? 'max-h-[500px] border-t border-slate-100 dark:border-slate-700 p-5' : 'max-h-0 overflow-hidden'}`}>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(config.points.dzikir).map((key) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 capitalize">{getKeyName(key)}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={(config.points.dzikir as any)[key]}
                                                onChange={(e) => handleChange('dzikir', key, parseInt(e.target.value))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            />
                                            <span className="text-xs font-black text-amber-500">{t.gamification.settings.pts}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
