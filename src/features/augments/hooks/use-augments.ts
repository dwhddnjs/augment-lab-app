import { useMemo } from 'react';
import { useLocale } from '@/hooks/use-locale';
import type { Augment } from '@/features/augments/types';

const data: Record<string, Augment[]> = {
  ko: require('@/features/augments/data/augments.ko.json'),
  en: require('@/features/augments/data/augments.en.json'),
};

export function useAugments(): Augment[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}
