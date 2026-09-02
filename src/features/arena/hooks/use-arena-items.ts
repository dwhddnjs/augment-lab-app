import type {
  ArenaSpecialAugment,
  PrismaticItem,
  StatShard,
} from '@/features/arena/types';
import type { Locale } from '@/hooks/use-locale';
import { useLocalizedData } from '@/lib/i18n';

const prismatic: Record<Locale, PrismaticItem[]> = {
  ko: require('@/features/arena/data/prismatic-items.ko.json'),
  en: require('@/features/arena/data/prismatic-items.en.json'),
};

const special: Record<Locale, ArenaSpecialAugment[]> = {
  ko: require('@/features/arena/data/special-augments.ko.json'),
  en: require('@/features/arena/data/special-augments.en.json'),
};

const shards: Record<Locale, StatShard[]> = {
  ko: require('@/features/arena/data/stat-shards.ko.json'),
  en: require('@/features/arena/data/stat-shards.en.json'),
};

export function usePrismaticItems(): PrismaticItem[] {
  return useLocalizedData(prismatic);
}

export function useSpecialAugments(): ArenaSpecialAugment[] {
  return useLocalizedData(special);
}

export function useStatShards(): StatShard[] {
  return useLocalizedData(shards);
}
