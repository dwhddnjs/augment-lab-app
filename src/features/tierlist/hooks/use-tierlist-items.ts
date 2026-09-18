import type { TierItem } from '@/features/tierlist/types';
import type { Locale } from '@/hooks/use-locale';
import { useLocalizedData } from '@/lib/i18n';

const byId = (items: TierItem[]) => new Map(items.map((i) => [i.id, i]));

/**
 * 티어리스트 아이템 사전(id → 이름·아이콘). 앱 items.ko.json 이 아니라 tierlist-items 에서
 * 온다 — 앱 아이템 데이터에 없는 id 가 섞여 있어 CDragon 에서 직접 구웠다.
 * 조회용 Map 은 로케일마다 모듈 로드 때 한 번만 만든다.
 */
const ITEMS: Record<Locale, Map<string, TierItem>> = {
  ko: byId(require('@/features/tierlist/data/tierlist-items.ko.json')),
  en: byId(require('@/features/tierlist/data/tierlist-items.en.json')),
};

export function useTierlistItems(): Map<string, TierItem> {
  return useLocalizedData(ITEMS);
}
