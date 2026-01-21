
import React, { useState, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { Language } from '../types';
import { translations, TranslationKey } from '../locales';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKey;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('al_rizq_language');
        if (saved === 'id' || saved === 'en') return saved;
        return 'id';
    });

    const handleSetLanguage = useCallback((lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('al_rizq_language', lang);
        // Dispatch event for other listeners if needed
        window.dispatchEvent(new Event('al_rizq_language_changed'));
    }, []);

    const t = useMemo(() => translations[language as keyof typeof translations] || translations['id'], [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
