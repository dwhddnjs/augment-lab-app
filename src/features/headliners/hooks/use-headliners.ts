import type { Locale } from '@/hooks/use-locale';
import { useLocalizedData } from '@/lib/i18n';
import type { HeadlinerTexts } from '../types';

const data: Record<Locale, HeadlinerTexts> = {
  ko: require('@/features/headliners/data/headliners.ko.json'),
  en: require('@/features/headliners/data/headliners.en.json'),
};

export function useHeadlinerTexts(): HeadlinerTexts {
  return useLocalizedData(data);
}
