import { useMemo } from 'react';
import { useLocale } from '@/hooks/use-locale';
import type {
  ArenaSpecialAugment,
  PrismaticItem,
  StatShard,
} from '@/features/arena/types';

const prismatic: Record<string, PrismaticItem[]> = {
  ko: require('@/features/arena/data/prismatic-items.ko.json'),
  en: require('@/features/arena/data/prismatic-items.en.json'),
};

const special: Record<string, ArenaSpecialAugment[]> = {
  ko: require('@/features/arena/data/special-augments.ko.json'),
  en: require('@/features/arena/data/special-augments.en.json'),
};

const shards: Record<string, StatShard[]> = {
  ko: require('@/features/arena/data/stat-shards.ko.json'),
  en: require('@/features/arena/data/stat-shards.en.json'),
};

export function usePrismaticItems(): PrismaticItem[] {
  const { locale } = useLocale();
  return useMemo(() => prismatic[locale] ?? prismatic.en, [locale]);
}

export function useSpecialAugments(): ArenaSpecialAugment[] {
  const { locale } = useLocale();
  return useMemo(() => special[locale] ?? special.en, [locale]);
}

export function useStatShards(): StatShard[] {
  const { locale } = useLocale();
  return useMemo(() => shards[locale] ?? shards.en, [locale]);
}
