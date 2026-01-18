
import React from 'react';
import { CloudDownload, CheckCircle } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';

interface SyncConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const SyncConfirmModal: React.FC<SyncConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                        <CloudDownload className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Sinkronisasi Cloud</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                        Kami menemukan data cadangan Anda di cloud. Apakah Anda ingin mengganti data lokal dengan data cloud tersebut?
                    </p>

                    <div className="grid grid-cols-1 w-full gap-3">
                        <Button
                            onClick={onConfirm}
                            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Gunakan Data Cloud
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            className="w-full h-14 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                            Tetap Gunakan Data Perangkat ini
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
