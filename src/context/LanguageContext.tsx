import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, TranslationSchema } from '../i18n/types';
import { hiTranslations } from '../i18n/hi';
import { enTranslations } from '../i18n/en';
import { formatDate, formatCurrency, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { trackLanguageSwitch } from '../firebase/analytics';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'alert';
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  // Overloaded translation function:
  // t(en, hi) -> returns hi if language is 'hi', else en
  // t('nav.home') -> returns translated string from dictionary
  t: (arg1: string, arg2?: string) => string;
  dict: TranslationSchema;
  formatDate: (date: Date | string | number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (num: number) => string;
  formatRelativeTime: (minutes: number) => string;
  toasts: ToastMessage[];
  showToast: (messageOrKey: string, type?: 'info' | 'success' | 'alert') => void;
  dismissToast: (id: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pws_language_v3';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default language is strictly Hindi ('hi')
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('pws_language');
      if (saved === 'en') return 'en';
      if (saved === 'hi') return 'hi';
      return 'hi'; // Default to Hindi
    } catch {
      return 'hi';
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dict = language === 'hi' ? hiTranslations : enTranslations;

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((messageOrKey: string, type: 'info' | 'success' | 'alert' = 'info') => {
    // Resolve key from dictionary if possible
    let displayMessage = messageOrKey;
    const activeDict = language === 'hi' ? hiTranslations : enTranslations;
    if (messageOrKey.includes('.')) {
      const parts = messageOrKey.split('.');
      let current: any = activeDict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      if (typeof current === 'string') {
        displayMessage = current;
      }
    } else if (messageOrKey in activeDict.notifications) {
      displayMessage = (activeDict.notifications as any)[messageOrKey];
    }

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message: displayMessage, type }]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [language, dismissToast]);

  const setLanguage = useCallback((lang: Language) => {
    if (lang !== language) {
      trackLanguageSwitch(language, lang);
    }
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage quota or incognito fallback
    }
    const toastMsg = lang === 'hi'
      ? hiTranslations.notifications.langSwitchedToHi
      : enTranslations.notifications.langSwitchedToEn;
    showToast(toastMsg, 'info');
  }, [language, showToast]);

  const toggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
  }, [language, setLanguage]);

  // Document language & locale synchronization (route/page SEO is handled by <RouteSEO /> & <SEO />)
  useEffect(() => {
    document.documentElement.lang = language;
    const localeEl = document.querySelector('meta[property="og:locale"]');
    if (localeEl) {
      localeEl.setAttribute('content', language === 'hi' ? 'hi_IN' : 'en_US');
    }
  }, [language]);

  // Universal translation function
  const t = useCallback((arg1: string, arg2?: string): string => {
    if (typeof arg2 === 'string') {
      // Dual-argument inline call: t(en, hi)
      return language === 'hi' ? arg2 : arg1;
    }

    // Dot-separated key path: e.g. 'nav.home'
    if (arg1.includes('.')) {
      const parts = arg1.split('.');
      let current: any = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return arg1; // fallback to key
        }
      }
      if (typeof current === 'string') {
        return current;
      }
    }

    return arg1;
  }, [language, dict]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    dict,
    formatDate: (date) => formatDate(date, language),
    formatCurrency: (amount, currency = 'INR') => formatCurrency(amount, language, currency),
    formatNumber: (num) => formatNumber(num, language),
    formatRelativeTime: (minutes) => formatRelativeTime(minutes, language),
    toasts,
    showToast,
    dismissToast,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Aliased hook for semantic clarity
export const useTranslation = useLanguage;
