
import React, { useState, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { Language } from '../types';
import { translations, TranslationKey } from '../locales';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKey;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode, language: Language, setLanguage: (lang: Language) => void }> = ({ children, language, setLanguage }) => {
    const t = useMemo(() => translations[language as keyof typeof translations] || translations['id'], [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
