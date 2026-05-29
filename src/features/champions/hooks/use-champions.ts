import { useMemo } from 'react';
import { useLocale } from '@/hooks/use-locale';
import type { Champion } from '@/features/champions/types';

const data: Record<string, Champion[]> = {
  ko: require('@/features/champions/data/champions.ko.json'),
  en: require('@/features/champions/data/champions.en.json'),
};

export function useChampions(): Champion[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}
