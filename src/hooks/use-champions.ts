import { useMemo } from 'react';
import { useLocale } from './use-locale';
import type { Champion } from '@/types/champion';

const data: Record<string, Champion[]> = {
  ko: require('@/data/champions.ko.json'),
  en: require('@/data/champions.en.json'),
};

export function useChampions(): Champion[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}
