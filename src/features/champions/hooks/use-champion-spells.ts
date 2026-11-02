import type { ChampionSpells } from '@/features/champions/types';
import type { Locale } from '@/hooks/use-locale';
import { useLocalizedData } from '@/lib/i18n';

const data: Record<Locale, Record<string, ChampionSpells>> = {
  ko: require('@/features/champions/data/champion-spells.ko.json'),
  en: require('@/features/champions/data/champion-spells.en.json'),
};

export function useChampionSpells(championId?: string): ChampionSpells | undefined {
  const spells = useLocalizedData(data);
  return championId ? spells[championId] : undefined;
}
