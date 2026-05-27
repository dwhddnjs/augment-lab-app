import { useMemo } from 'react';
import { useLocale } from './use-locale';
import type { Item } from '@/types/item';

const data: Record<string, Item[]> = {
  ko: require('@/data/items.ko.json'),
  en: require('@/data/items.en.json'),
};

export function useItems(): Item[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}
