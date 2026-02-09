import React, { useState, useEffect } from 'react';
import { Lock, Delete, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface PinLockProps {
    onSuccess: (pin?: string) => void;
    onCancel: () => void;
    savedPin?: string;
    setupMode?: boolean;
    title?: string;
    description?: string;
}

export const PinLock: React.FC<PinLockProps> = ({
    onSuccess,
    onCancel,
    savedPin,
    setupMode = false,
    title,
    description
}) => {
    const [pin, setPin] = useState<string>('');
    const [error, setError] = useState<boolean>(false);
    const [isChecking, setIsChecking] = useState<boolean>(false);

    const handleNumberClick = (num: string) => {
        if (pin.length < 5) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    useEffect(() => {
        if (pin.length === 5) {
            setIsChecking(true);
            // Small delay for visual feedback
            const timer = setTimeout(() => {
                if (setupMode) {
                    onSuccess(pin);
                } else if (pin === savedPin) {
                    onSuccess();
                } else {
                    setError(true);
                    setPin('');
                    setIsChecking(false);
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [pin, savedPin, setupMode, onSuccess]);

    const displayTitle = title || (setupMode ? "Setup PIN" : "PIN Required");
    const displayDescription = description || (setupMode ? "Set a 5-digit PIN for security" : "Please enter your 5-digit PIN to continue");

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all ${error ? 'animate-shake' : ''}`}>
                <div className="flex justify-between items-center mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${error ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'}`}>
                        {error ? <ShieldAlert className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-center mb-10">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{error ? "Incorrect PIN" : displayTitle}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">{error ? "The PIN you entered is incorrect. Please try again." : displayDescription}</p>
                </div>

                {/* PIN Indicators */}
                <div className="flex justify-center gap-6 mb-12">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i
                                ? 'bg-emerald-500 border-emerald-500 scale-125'
                                : 'border-slate-200 dark:border-slate-700'
                                } ${error && pin.length === 0 ? 'bg-rose-500 border-rose-500' : ''}`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-6">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            disabled={isChecking}
                            className="h-16 w-16 mx-auto rounded-2xl bg-slate-50 dark:bg-slate-800 text-2xl font-black text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition-all font-sans"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="h-16 w-16" /> {/* Spacer */}
                    <button
                        onClick={() => handleNumberClick('0')}
                        disabled={isChecking}
                        className="h-16 w-16 mx-auto rounded-2xl bg-slate-50 dark:bg-slate-800 text-2xl font-black text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition-all font-sans"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isChecking || pin.length === 0}
                        className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-90 transition-all"
                    >
                        <Delete className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}} />
        </div>
    );
};
