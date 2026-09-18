import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { TierlistAugmentGrid } from '@/features/tierlist/components/tierlist-augment-grid';
import { PREVIEW_COUNT, useStagedExpand } from '@/features/tierlist/hooks/use-staged-expand';
import type { AugmentGroup } from '@/features/tierlist/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: {
    augments: '증강',
    showAll: '모든 증강 보기',
    showLess: '증강 접기',
    silver: '실버',
    gold: '골드',
    prismatic: '프리즘',
  },
  en: {
    augments: 'Augments',
    showAll: 'Show all augments',
    showLess: 'Show fewer augments',
    silver: 'Silver',
    gold: 'Gold',
    prismatic: 'Prismatic',
  },
};

interface Props {
  groups: AugmentGroup[];
  /** 펼치기 직전에 불린다 — 화면이 맨 위로 스크롤해 프리즘부터 차례로 보게 한다. */
  onExpand: () => void;
}

/**
 * 추천 증강 섹션 — 제목 + 희귀도 그룹 격자 + "모든 증강 보기".
 * 기본은 그룹마다 상위 PREVIEW_COUNT 개만, 펼치면 단계적으로 전량(use-staged-expand).
 */
export function TierlistAugmentSection({ groups, onExpand }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const { limit, expanded, canExpand, toggle } = useStagedExpand(
    Math.max(0, ...groups.map((g) => g.list.length)),
  );

  if (!groups.length) return null;

  return (
    <>
      <ThemedText type="heading" style={styles.title}>
        {translate('augments')}
      </ThemedText>
      {groups.map(({ rarity, list }) => (
        <TierlistAugmentGrid
          key={rarity}
          rarity={rarity}
          label={translate(rarity)}
          entries={list.slice(0, limit)}
          fadeFrom={PREVIEW_COUNT}
        />
      ))}
      {canExpand && (
        <Pressable
          // 접을 때는 콘텐츠가 줄면서 ScrollView 가 끝으로 당겨져 이 버튼·아이템 섹션이 화면에 남는다.
          // 펼칠 때는 증강이 버튼 자리에서 쏟아지면 어지러워 맨 위로 올린다.
          onPress={() => {
            if (!expanded) onExpand();
            toggle();
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          style={[
            styles.showAll,
            { backgroundColor: colors.surface.raised, borderColor: colors.border.subtle },
          ]}
        >
          <ThemedText type="label" color="secondary" style={styles.showAllText}>
            {translate(expanded ? 'showLess' : 'showAll')}
          </ThemedText>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingTop: Spacing.three,
  },
  showAll: {
    // 위 증강 격자와는 그룹 paddingBottom + 본문 gap(8+8)만으로 붙인다.
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
  },
  showAllText: {
    // label(14) 굵기·줄높이는 두고 글자만 caption 크기로 — 버튼 높이(38)는 그대로다.
    fontSize: Typography.caption.fontSize,
  },
});
