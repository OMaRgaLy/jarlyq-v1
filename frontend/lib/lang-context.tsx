'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, Translations, translations } from './i18n';

interface LangContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const LangContext = createContext<LangContextType>({
  locale: 'ru',
  setLocale: () => {},
  t: translations.ru,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    const saved = localStorage.getItem('jarlyq_lang') as Locale | null;
    if (saved && saved in translations) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('jarlyq_lang', l);
  };

  return (
    <LangContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
