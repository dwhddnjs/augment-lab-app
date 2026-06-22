import { useLocale, type Locale } from '@/hooks/use-locale';

type Dict = Record<string, string>;

export function useTranslation<T extends Dict>(translations: Record<Locale, T>) {
  const { locale } = useLocale();
  return (key: keyof T): string =>
    (translations[locale] ?? translations.en)[key as string] ?? translations.en[key as string] ?? '';
}

// 챔피언 역할 태그 표시 순서 — 필터칩 등 UI 노출 순서의 단일 출처.
export const CHAMPION_TAGS = [
  "Fighter",
  "Assassin",
  "Mage",
  "Tank",
  "Marksman",
  "Support",
] as const;

// 챔피언 역할 태그(Fighter 등) 공용 라벨. 화면별 `t` 사전에 spread 해서
// `translate(tag)`로 그대로 쓴다 (picked-drawer·build-detail 등 중복 제거).
export const CHAMPION_TAG_LABELS: Record<Locale, Record<string, string>> = {
  ko: {
    Fighter: '전사',
    Mage: '마법사',
    Assassin: '암살자',
    Tank: '탱커',
    Marksman: '원거리',
    Support: '서포터',
  },
  en: {
    Fighter: 'Fighter',
    Mage: 'Mage',
    Assassin: 'Assassin',
    Tank: 'Tank',
    Marksman: 'Marksman',
    Support: 'Support',
  },
};
