import { useMemo } from 'react';
import { useLocale } from './use-locale';
import type { Augment } from '@/types/augment';

const data: Record<string, Augment[]> = {
  ko: require('@/data/augments.ko.json'),
  en: require('@/data/augments.en.json'),
};

export function useAugments(): Augment[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}
