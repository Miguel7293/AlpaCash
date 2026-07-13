"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, translations, type Dictionary, type Locale } from "@/lib/i18n/translations";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "alpacash_locale";

function isLocale(value: string | null): value is Locale {
  return value === "es" || value === "en" || value === "qu";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always starts at DEFAULT_LOCALE (matching SSR output) to avoid a hydration
  // mismatch, then swaps to the stored locale right after mount.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored) && stored !== DEFAULT_LOCALE) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage post-mount, cannot run during SSR-matching render
        setLocaleState(stored);
      }
    } catch {
      // localStorage unavailable — keep default locale
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — locale still applies for this session
    }
  }

  const value = useMemo(
    () => ({ locale, setLocale, t: translations[locale] }),
    [locale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
