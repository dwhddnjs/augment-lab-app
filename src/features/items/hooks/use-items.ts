import { useMemo } from 'react';
import { useLocale } from '@/hooks/use-locale';
import type { Item } from '@/features/items/types';

const data: Record<string, Item[]> = {
  ko: require('@/features/items/data/items.ko.json'),
  en: require('@/features/items/data/items.en.json'),
};

export function useItems(): Item[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}
