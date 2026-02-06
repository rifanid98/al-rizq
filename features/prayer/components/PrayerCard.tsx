
import React from 'react';
import { CheckCircle, Home, Users, User, CloudRain, SunMedium, Lock } from 'lucide-react';
import { PrayerName, PrayerLog } from '../../../shared/types';
import { PRAYER_COLORS, PRAYER_IMAGES } from '../../../shared/constants';
import { Button } from '../../../shared/components/ui/Button';
import { useLanguage } from '../../../shared/hooks/useLanguage';

interface PrayerCardProps {
    name: PrayerName;
    time: string;
    loggedToday?: PrayerLog;
    isPassed: boolean;
    isFlashbackMode: boolean;
    showPrayerBg: boolean;
    prayerBgOpacity: number;
    onPrayerClick: (name: PrayerName, time: string) => void;
    onEditPrayer: (log: PrayerLog) => void;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({
    name,
    time,
    loggedToday,
    isPassed,
    isFlashbackMode,
    showPrayerBg,
    prayerBgOpacity,
    onPrayerClick,
    onEditPrayer
}) => {
    const { t } = useLanguage();
    return (
        <div className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col transition-all hover:shadow-2xl dark:hover:shadow-emerald-950/20 hover:border-emerald-100 dark:hover:border-emerald-900 group ${isFlashbackMode && !loggedToday ? 'ring-2 ring-amber-500/20' : ''}`}>
            {/* Thematic Background Image */}
            {showPrayerBg && (
                <div
                    className="absolute inset-0 transition-opacity duration-700 bg-cover bg-center pointer-events-none"
                    style={{
                        backgroundImage: `url(${PRAYER_IMAGES[name]})`,
                        opacity: prayerBgOpacity / 100
                    }}
                />
            )}

            <div className="relative z-10 flex justify-between items-start mb-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${PRAYER_COLORS[name]}`}>{name}</div>
                <div className="text-3xl font-black text-slate-800 dark:text-slate-100 font-arabic">{time || '--:--'}</div>
            </div>
            <div className="relative z-10 pt-2">
                {loggedToday ? (
                    <div className="space-y-3">
                        <div
                            className="relative overflow-hidden flex items-center justify-between text-emerald-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl p-1 transition-colors"
                            onClick={() => onEditPrayer(loggedToday)}
                            title="Klik untuk ubah detail"
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6" />
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.tracker.execution.title}</p>
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${loggedToday.status === 'Tepat Waktu' || loggedToday.status === 'Ontime' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                                            {loggedToday.status === 'Tepat Waktu' || loggedToday.status === 'Ontime' ? t.tracker.status.ontime : t.tracker.status.late}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{loggedToday.actualTime}</p>
                                        {loggedToday.delayMinutes > 0 && (
                                            <span className={`text-[10px] font-bold ${loggedToday.status === 'Tepat Waktu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                (+{loggedToday.delayMinutes}m)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {loggedToday.locationType === 'Masjid' ? (
                                <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none opacity-[0.06] dark:opacity-[0.12] dark:invert">
                                    <img
                                        src="assets/mosque_watermark.png"
                                        alt="Masjid"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400" title="Dilaksanakan di Rumah">
                                        <Home className="w-4 h-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {loggedToday.isMasbuq && (
                                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Masbuq: {loggedToday.masbuqRakaat}</span>
                                </div>
                            )}
                            {loggedToday.executionType && (
                                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    {loggedToday.executionType === 'Jamaah' ? <Users className="w-3 h-3 text-emerald-600" /> : <User className="w-3 h-3 text-slate-400" />}
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                        {loggedToday.executionType === 'Jamaah' ? t.tracker.execution.jamaah : t.tracker.execution.munfarid}
                                    </span>
                                </div>
                            )}
                            {loggedToday.weatherCondition && (
                                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    {loggedToday.weatherCondition === 'Hujan' ? <CloudRain className="w-3 h-3 text-blue-500" /> : <SunMedium className="w-3 h-3 text-amber-500" />}
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                        {loggedToday.weatherCondition === 'Hujan' ? t.tracker.weather.rainy : t.tracker.weather.clear}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Button
                            className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10"
                            disabled={!time || !isPassed}
                            onClick={() => time && onPrayerClick(name, time)}
                        >
                            {!isPassed ? <Lock className="w-4 h-4 mr-2 opacity-50" /> : null}
                            {isPassed ? t.tracker.markPrayer : t.tracker.notTimeYet}
                        </Button>
                        {!isPassed && time && (
                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">{t.tracker.readyAt} {time}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
