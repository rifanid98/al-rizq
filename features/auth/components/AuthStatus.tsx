
import React from 'react';
import { Cloud, LogOut } from 'lucide-react';
import { UserProfile } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';

interface AuthStatusProps {
    user: UserProfile | null;
    onLogout: () => void;
    googleBtnRef: React.RefObject<HTMLDivElement | null>;
    mode: 'sidebar' | 'header';
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ user, onLogout, googleBtnRef, mode }) => {
    if (mode === 'sidebar') {
        return (
            <div className="hidden lg:block w-full px-2 mt-auto border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
                {user ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                            <img src={user.picture} alt="Avatar" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                <div className="flex items-center gap-1 mt-1 opacity-60">
                                    <Cloud className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[9px] font-bold text-slate-400">Terakhir Sinkron: {localStorage.getItem(STORAGE_KEYS.LAST_SYNC) ? new Date(parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SYNC)!)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Belum'}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:text-rose-600 rounded-xl text-xs font-medium transition-all">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                ) : (
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
                        <p className="text-[11px] font-black uppercase text-slate-400 text-center">Cloud Sync</p>
                        <div ref={googleBtnRef} className="rounded-full shadow-md overflow-hidden transform hover:scale-110 active:scale-95 transition-all"></div>
                    </div>
                )}
            </div>
        );
    }

    // Header mode (Mobile/Tablet)
    return (
        <>
            {user ? (
                <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <img src={user.picture} alt="Avatar" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg border border-white dark:border-slate-800" />
                    <div className="hidden sm:flex flex-col pr-1">
                        <p className="text-[9px] font-black text-slate-800 dark:text-slate-100 truncate max-w-[80px]">{user.name}</p>
                        <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">Synced</span>
                    </div>
                    <button onClick={onLogout} className="p-2 text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <div ref={googleBtnRef} className="rounded-full overflow-hidden scale-75 origin-right"></div>
            )}
        </>
    );
};
