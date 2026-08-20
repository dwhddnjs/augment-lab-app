import { useMemo } from 'react';
import { useLocale } from '@/hooks/use-locale';
import type { Augment, AugmentMode } from '@/features/augments/types';

const data: Record<string, Augment[]> = {
  ko: require('@/features/augments/data/augments.ko.json'),
  en: require('@/features/augments/data/augments.en.json'),
};

/**
 * 전체 증강 목록. 저장된 빌드의 증강 id를 이름으로 되돌릴 때처럼 **조회**에 쓴다.
 * 과거 빌드가 지금은 어느 모드에도 없는 증강을 참조할 수 있으므로 여기서 거르지 않는다.
 */
export function useAugments(): Augment[] {
  const { locale } = useLocale();
  return useMemo(() => data[locale] ?? data.en, [locale]);
}

/**
 * 해당 모드에서 실제로 뽑히는 증강만. 시뮬레이션 풀은 반드시 이걸 쓴다.
 * modes 가 없는 항목은 뽑히지 않는다 — 모드 태그가 안 붙은 데이터를 조용히 흘려보내면
 * 다른 모드 전용 증강이 풀을 오염시킨다(클래식 증강이 칼바람에 섞였던 사고가 그 경우다).
 */
export function useAugmentPool(mode: AugmentMode): Augment[] {
  const all = useAugments();
  return useMemo(() => all.filter((a) => a.modes?.includes(mode)), [all, mode]);
}
