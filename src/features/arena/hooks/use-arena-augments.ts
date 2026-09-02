import type { ArenaAugment } from '@/features/arena/types';
import type { Locale } from '@/hooks/use-locale';
import { useLocalizedData } from '@/lib/i18n';

const data: Record<Locale, ArenaAugment[]> = {
  ko: require('@/features/arena/data/augments.ko.json'),
  en: require('@/features/arena/data/augments.en.json'),
};

export function useArenaAugments(): ArenaAugment[] {
  return useLocalizedData(data);
}
