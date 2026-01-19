
import React from 'react';
import { X, MapPin, Clock, CheckCircle, Info, SunMedium, Moon, User, ChevronDown } from 'lucide-react';
import { PrayerName, PrayerLog } from '../../../shared/types';
import { PRAYER_RAKAAT } from '../../../shared/constants';
import { Button } from '../../../shared/components/ui/Button';
import { useLanguage } from '../../../shared/hooks/useLanguage';

interface LatePrayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingLatePrayer: { name: PrayerName; scheduledTime: string } | null;
    lateReason: string;
    setLateReason: (val: string) => void;
    isMasbuq: boolean;
    setIsMasbuq: (val: boolean) => void;
    masbuqRakaat: number;
    setMasbuqRakaat: (val: number) => void;
    locationType: 'Rumah' | 'Masjid';
    setLocationType: (val: 'Rumah' | 'Masjid') => void;
    executionType: 'Jamaah' | 'Munfarid';
    setExecutionType: (val: 'Jamaah' | 'Munfarid') => void;
    weatherCondition: 'Cerah' | 'Hujan';
    setWeatherCondition: (val: 'Cerah' | 'Hujan') => void;
    editingLogId: string | null;
    isLateEntry: boolean;
    isForgotMarking: boolean;
    setIsForgotMarking: (val: boolean) => void;
    showMasbuqPicker: boolean;
    setShowMasbuqPicker: (val: boolean) => void;
    hasDzikir: boolean;
    setHasDzikir: (val: boolean) => void;
    hasQobliyah: boolean;
    setHasQobliyah: (val: boolean) => void;
    hasBadiyah: boolean;
    setHasBadiyah: (val: boolean) => void;
    hasDua: boolean;
    setHasDua: (val: boolean) => void;
    isSunnahExpanded: boolean;
    setIsSunnahExpanded: (val: boolean) => void;
    onConfirm: () => void;
}

export const LatePrayerModal: React.FC<LatePrayerModalProps> = ({
    isOpen,
    onClose,
    pendingLatePrayer,
    lateReason,
    setLateReason,
    isMasbuq,
    setIsMasbuq,
    masbuqRakaat,
    setMasbuqRakaat,
    locationType,
    setLocationType,
    executionType,
    setExecutionType,
    weatherCondition,
    setWeatherCondition,
    editingLogId,
    isLateEntry,
    isForgotMarking,
    setIsForgotMarking,
    showMasbuqPicker,
    setShowMasbuqPicker,
    hasDzikir,
    setHasDzikir,
    hasQobliyah,
    setHasQobliyah,
    hasBadiyah,
    setHasBadiyah,
    hasDua,
    setHasDua,
    isSunnahExpanded,
    setIsSunnahExpanded,
    onConfirm
}) => {
    const { t } = useLanguage();
    if (!isOpen || !pendingLatePrayer) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-slate-100 dark:border-slate-800">
                {/* Modal Header */}
                <div className="p-8 pb-4 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t.tracker.prayerDetails} {pendingLatePrayer.name}</h3>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm ml-11">
                            {t.tracker.scheduledTime}: <span className="text-emerald-600 dark:text-emerald-400">{pendingLatePrayer.scheduledTime}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:rotate-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-8 pt-4 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.common.location}</p>
                            <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
                                <button
                                    onClick={() => setLocationType('Masjid')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${locationType === 'Masjid' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.tracker.execution.atMosque}
                                </button>
                                <button
                                    onClick={() => setLocationType('Rumah')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${locationType === 'Rumah' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.tracker.execution.atHome}
                                </button>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.tracker.execution.title}</p>
                            <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
                                <button
                                    onClick={() => setExecutionType('Jamaah')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${executionType === 'Jamaah' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.tracker.execution.jamaah}
                                </button>
                                <button
                                    onClick={() => setExecutionType('Munfarid')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${executionType === 'Munfarid' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.tracker.execution.munfarid}
                                </button>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.tracker.masbuq}?</p>
                                {isMasbuq && !showMasbuqPicker && (
                                    <button
                                        onClick={() => setShowMasbuqPicker(true)}
                                        className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight hover:underline"
                                    >
                                        {masbuqRakaat} &nbsp;Rakaat
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const newVal = !isMasbuq;
                                    setIsMasbuq(newVal);
                                    setShowMasbuqPicker(newVal);
                                }}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-2 ${isMasbuq ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-white dark:bg-slate-900 border-transparent text-slate-500'}`}
                            >
                                {isMasbuq ? t.common.yes : t.common.no}
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.tracker.weather.title}</p>
                            <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
                                <button
                                    onClick={() => setWeatherCondition('Cerah')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${weatherCondition === 'Cerah' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.tracker.weather.clear}
                                </button>
                                <button
                                    onClick={() => setWeatherCondition('Hujan')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${weatherCondition === 'Hujan' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.tracker.weather.rainy}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isMasbuq && showMasbuqPicker && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 animate-in zoom-in-95 duration-200 relative">
                            <button
                                onClick={() => setShowMasbuqPicker(false)}
                                className="absolute top-2 right-2 p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg text-amber-700 dark:text-amber-400 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-3 text-center">{t.tracker.howManyRakaats}</p>
                            <div className="flex justify-center gap-2">
                                {Array.from({ length: PRAYER_RAKAAT[pendingLatePrayer.name] }, (_, i) => i + 1).map(r => (
                                    <button
                                        key={r}
                                        onClick={() => {
                                            setMasbuqRakaat(r);
                                            setTimeout(() => setShowMasbuqPicker(false), 300);
                                        }}
                                        className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center transition-all ${masbuqRakaat === r ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isLateEntry && !editingLogId && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.tracker.markAs}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        setIsForgotMarking(false);
                                        setLocationType('Rumah');
                                        setExecutionType('Munfarid');
                                        setWeatherCondition('Hujan');
                                    }}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all group ${!isForgotMarking ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 shadow-sm shadow-amber-500/10' : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'}`}
                                >
                                    <Clock className={`w-4 h-4 transition-transform ${!isForgotMarking ? 'text-amber-600 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${!isForgotMarking ? 'text-amber-800 dark:text-amber-400' : 'text-slate-500'}`}>{t.tracker.status.late}</span>
                                </button>
                                <button
                                    onClick={() => setIsForgotMarking(true)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all group ${isForgotMarking ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-sm shadow-emerald-500/10' : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'}`}
                                >
                                    <CheckCircle className={`w-4 h-4 transition-transform ${isForgotMarking ? 'text-emerald-600 scale-110' : 'text-slate-400 group-hover:scale-105'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isForgotMarking ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-500'}`}>{t.tracker.forgotMarking}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setIsSunnahExpanded(!isSunnahExpanded)}
                            className="w-full flex items-center justify-between p-4 hover:bg-emerald-100/30 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{t.dashboard.sunnahStats}</p>
                            <ChevronDown className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${isSunnahExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isSunnahExpanded && (
                            <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setHasQobliyah(!hasQobliyah)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasQobliyah ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasQobliyah ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <SunMedium className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-left leading-tight">{t.tracker.qobliyah}</span>
                                    </button>

                                    <button
                                        onClick={() => setHasBadiyah(!hasBadiyah)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasBadiyah ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasBadiyah ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <Moon className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-left leading-tight">{t.tracker.badiyah}</span>
                                    </button>

                                    <button
                                        onClick={() => setHasDzikir(!hasDzikir)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasDzikir ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasDzikir ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-left leading-tight">{t.tracker.dzikir}</span>
                                    </button>

                                    <button
                                        onClick={() => setHasDua(!hasDua)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${hasDua ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasDua ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-left leading-tight">{t.tracker.dua}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                            {t.tracker.additionalNotes}
                        </label>
                        <textarea
                            value={lateReason}
                            onChange={(e) => setLateReason(e.target.value)}
                            placeholder={t.tracker.latePrompt}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 font-medium resize-none shadow-inner"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Modal Footer - Sticky */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            onClick={onClose}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                            onClick={onConfirm}
                        >
                            {t.common.save}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
