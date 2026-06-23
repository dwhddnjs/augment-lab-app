import { useMemo } from 'react';
import { useLocale } from '@/hooks/use-locale';
import type { ArenaAugment } from '@/features/arena/types';

const data: Record<string, ArenaAugment[]> = {
  ko: require('@/features/arena/data/augments.ko.json'),
  en: require('@/features/arena/data/augments.en.json'),
};

export function useArenaAugments(): ArenaAugment[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}
