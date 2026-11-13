import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'hi' | 'en';

const STORAGE_KEY = 'gaukripa_lang';

interface LanguageContextValue {
  lang: AppLanguage;
  isHi: boolean;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  tr: (hiText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'hi',
  isHi: true,
  setLang: () => {},
  toggleLang: () => {},
  tr: (hiText) => hiText,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'hi') {
          return saved;
        }
      } catch (err) {
        console.warn('Unable to read language preference from localStorage:', err);
      }
    }
    return 'hi'; // Default language is Hindi
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      console.warn('Unable to persist language preference to localStorage:', err);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (next: AppLanguage) => {
    setLangState(next);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  const tr = (hiText: string, enText: string) => (lang === 'hi' ? hiText : enText);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        isHi: lang === 'hi',
        setLang,
        toggleLang,
        tr,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
