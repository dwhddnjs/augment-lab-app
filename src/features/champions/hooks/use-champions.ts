import type { Locale } from '@/hooks/use-locale';
import type { Champion } from '@/features/champions/types';
import { useLocalizedData } from '@/lib/i18n';

const data: Record<Locale, Champion[]> = {
  ko: require('@/features/champions/data/champions.ko.json'),
  en: require('@/features/champions/data/champions.en.json'),
};

export function useChampions(): Champion[] {
  return useLocalizedData(data);
}
