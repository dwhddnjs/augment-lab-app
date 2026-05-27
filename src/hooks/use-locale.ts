import { useState } from 'react';

export type Locale = 'ko' | 'en';

let _locale: Locale = 'ko';
const listeners = new Set<() => void>();

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(_locale);

  function setLocale(next: Locale) {
    _locale = next;
    setLocaleState(next);
    listeners.forEach((l) => l());
  }

  return { locale, setLocale };
}

export function getLocale(): Locale {
  return _locale;
}
