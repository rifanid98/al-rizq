
import React from 'react';
import { GamificationConfig } from '../../../shared/types';
import { useLanguage } from '../../../shared/hooks/useLanguage';
import { Star } from 'lucide-react';

interface GamificationSettingsProps {
    config: GamificationConfig;
    onChange: (config: GamificationConfig) => void;
}

export const GamificationSettings: React.FC<GamificationSettingsProps> = ({ config, onChange }) => {
    const { t } = useLanguage();

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    {t.gamification.settings.title}
                </h3>
                <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    onClick={() => handleToggle(!config.enabled)}
                    style={{ backgroundColor: config.enabled ? '#10b981' : '#9ca3af' }}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {config.enabled && (
                <>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">{t.gamification.settings.pointsPrayer}</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.keys(config.points.prayer).map((key) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 capitalize">{getKeyName(key)}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={(config.points.prayer as any)[key]}
                                            onChange={(e) => handleChange('prayer', key, parseInt(e.target.value))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
                                        />
                                        <span className="text-xs font-black text-amber-500">{t.gamification.settings.pts}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">{t.gamification.settings.pointsFasting}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(config.points.fasting).map((key) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 capitalize">{getKeyName(key)}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={(config.points.fasting as any)[key]}
                                                onChange={(e) => handleChange('fasting', key, parseInt(e.target.value))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
                                            />
                                            <span className="text-xs font-black text-amber-500">{t.gamification.settings.pts}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">{t.gamification.settings.pointsDzikir}</h4>
                            <div className="grid grid-cols-1 gap-4">
                                {Object.keys(config.points.dzikir).map((key) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 capitalize">{getKeyName(key)}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={(config.points.dzikir as any)[key]}
                                                onChange={(e) => handleChange('dzikir', key, parseInt(e.target.value))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
                                            />
                                            <span className="text-xs font-black text-amber-500">{t.gamification.settings.pts}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
