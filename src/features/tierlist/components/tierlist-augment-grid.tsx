import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed/themed-text';
import { AugmentTile } from '@/components/ui/augment-tile';
import { AugmentRarityColors, HeroOverlay, Radius, Spacing, TierColors } from '@/constants/theme';
import type { Augment } from '@/features/augments/types';
import { augTierOf } from '@/features/tierlist/tiers';
import { useTheme } from '@/hooks/use-theme';

/** 증강 격자 카드의 아이콘·배지 크기. 배지를 아이콘 하단 가운데에 물리는 계산에 쓴다. */
const AUG_ICON = 40;
const AUG_BADGE = 18;
/** 배지 글자 — caption(12/16)보다 한 단계 작아야 18pt 원 안에 들어간다. */
const BADGE_FONT = { fontSize: 10, lineHeight: 14 };
/** 펼쳐서 새로 붙는 카드의 페이드. 동작 줄이기가 켜져 있으면 reanimated 가 건너뛴다(기본 ReduceMotion.System). */
const CARD_FADE = FadeIn.duration(220);

interface Props {
  rarity: Augment['rarity'];
  label: string;
  /** 이미 보여줄 개수·순서로 잘라 온 목록. `tier` 는 소스 티어(1~4). */
  entries: { aug: Augment; tier: number }[];
  /** 이 인덱스부터의 카드는 마운트될 때 페이드로 나온다. 처음부터 보이는 카드까지 깜빡이지 않게. */
  fadeFrom?: number;
}

/** 희귀도 그룹 하나 — 라벨 + 2열 증강 카드(아이콘 하단에 등급 배지, 우측 선은 등급색). */
export function TierlistAugmentGrid({ rarity, label, entries, fadeFrom = Infinity }: Props) {
  return (
    <View style={styles.group}>
      <ThemedText type="label" color="secondary">
        {label}
      </ThemedText>
      <View style={styles.grid}>
        {entries.map(({ aug, tier }, i) => (
          <AugmentCard key={aug.id} aug={aug} tier={tier} rarity={rarity} fade={i >= fadeFrom} />
        ))}
      </View>
    </View>
  );
}

/**
 * 카드 한 장. 단계 펼침은 50ms 마다 `entries` 를 새로 잘라 넘기는데, 카드를 컴포넌트로 떼어 두면
 * React Compiler 가 props(aug·tier·rarity·fade)가 같은 카드의 JSX 를 캐시해 이미 붙은 카드는 다시 그리지 않는다.
 */
function AugmentCard({
  aug,
  tier,
  rarity,
  fade,
}: {
  aug: Augment;
  tier: number;
  rarity: Augment['rarity'];
  fade: boolean;
}) {
  const { colors, mode } = useTheme();
  const badge = augTierOf(tier);
  const badgeColor = TierColors[mode][badge];

  return (
    <Animated.View
      entering={fade ? CARD_FADE : undefined}
      style={[
        styles.card,
        { backgroundColor: colors.surface.raised, borderRightColor: badgeColor },
      ]}
    >
      <View>
        <AugmentTile
          iconPath={aug.iconPath}
          rarity={rarity}
          size={AUG_ICON}
          background={HeroOverlay.cardBase}
          recyclingKey={aug.id}
        />
        {/* 아이콘 하단 가운데에 걸친 증강 등급. 아이콘 위라 배경은 불투명이어야 읽힌다. */}
        <View
          style={[
            styles.badge,
            {
              // 테두리는 아이콘과 같은 희귀도색 — 배지가 타일에 이어 붙은 것처럼 보인다.
              // AugmentTile 과 같은 팔레트를 직접 쓴다(타일 배경이 모드 무관 어두운 톤).
              borderColor: AugmentRarityColors[rarity].border,
              backgroundColor: colors.surface.sunken,
            },
          ]}
        >
          <ThemedText type="caption" style={[styles.badgeText, { color: badgeColor }]}>
            {badge}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="caption" numberOfLines={2} style={styles.name}>
        {aug.name}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    // 2열. gap 을 뺀 절반보다 조금 작게 잡아야 반올림 오차로 줄이 깨지지 않는다.
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    // 우측 선은 등급색. 희귀도색은 아이콘·배지 테두리가 맡는다 — 두 정보를 색으로 갈라 둔다.
    borderRightWidth: 2.5,
  },
  name: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    // 아이콘 폭 기준 가운데. 부모 View 는 아이콘에 딱 맞는 크기다.
    left: (AUG_ICON - AUG_BADGE) / 2,
    // 아이콘 밖으로 절반 가까이 빼서 아이콘을 덜 가린다(카드 padding 8 안에 들어가는 한도).
    bottom: -Spacing.two,
    // 원형이라 폭·높이를 같게 고정한다(글자가 한 자라 늘어날 일이 없다).
    width: AUG_BADGE,
    height: AUG_BADGE,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '800',
    ...BADGE_FONT,
  },
});
