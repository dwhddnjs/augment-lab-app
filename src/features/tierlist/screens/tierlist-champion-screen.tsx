/**
 * TierlistChampionScreen — 티어리스트 챔피언 상세(모달).
 *
 * 챔피언 지표 + 어울리는 증강(희귀도 3그룹) + 어울리는 아이템. 칼바람 전용이다.
 * 두 목록이 전부 DetailCardRow 한 컴포넌트라 렌더러는 map 두 개면 끝난다.
 *
 * 아이템 이름·아이콘은 앱 items.ko.json 이 아니라 tierlist-items.{ko,en}.json 에서 온다
 * — 앱 아이템 데이터에 없는 id 가 섞여 있어 CDragon 에서 직접 구웠다.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { AugmentTile } from '@/components/ui/augment-tile';
import { DetailCardRow } from '@/components/ui/detail-card-row';
import { RemoteImage } from '@/components/ui/remote-image';
import {
  AugmentRarityColors,
  HeroOverlay,
  Radius,
  Spacing,
  TierColors,
} from '@/constants/theme';
import type { Augment } from '@/features/augments/types';
import { useAugments } from '@/features/augments/hooks/use-augments';
import { useChampions } from '@/features/champions/hooks/use-champions';
import {
  type TierEntry,
  augSlugs,
  augTierOf,
  findTierRow,
  tierOf,
  tierlistMeta,
} from '@/features/tierlist/tiers';
import { type Locale, useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { cdragonItemIconUrl, championSquareUrl } from '@/lib/ddragon';
import { CHAMPION_TAG_LABELS, useLocalizedData, useTranslation } from '@/lib/i18n';

interface TierItem {
  id: string;
  name: string;
  iconPath: string;
}

const itemData: Record<Locale, TierItem[]> = {
  ko: require('@/features/tierlist/data/tierlist-items.ko.json'),
  en: require('@/features/tierlist/data/tierlist-items.en.json'),
};

const t = {
  ko: {
    screenTitle: '챔피언 정보',
    showAll: '모든 증강 보기',
    augments: '증강',
    items: '아이템',
    silver: '실버',
    gold: '골드',
    prismaticRarity: '프리즘',
    games: '판',
    winRate: '승률',
    pickRate: '픽률',
    source: '아이템은 일반 칼바람(ARAM) 통계 · 패치 {patch} · {date} 기준',
  },
  en: {
    screenTitle: 'Champion Info',
    showAll: 'Show all augments',
    augments: 'Augments',
    items: 'Items',
    silver: 'Silver',
    gold: 'Gold',
    prismaticRarity: 'Prismatic',
    games: 'games',
    winRate: 'Win',
    pickRate: 'Pick',
    source: 'Item stats are from standard ARAM · Patch {patch} · as of {date}',
  },
};

/** 프리즘 → 골드 → 실버. 등급이 높은 쪽을 먼저 보여준다. */
const RARITIES = ['prismatic', 'gold', 'silver'] as const;

/** 희귀도별 기본 노출 개수. 나머지는 "모든 증강 보기"로 펼친다. */
const PREVIEW_COUNT = 6;

/** 증강 격자 카드의 아이콘·배지 크기. 배지를 아이콘 하단 가운데에 물리는 계산에 쓴다. */
const AUG_ICON = 40;
const AUG_BADGE = 18;
const RARITY_KEY = { silver: 'silver', gold: 'gold', prismatic: 'prismaticRarity' } as const;

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function TierlistChampionScreen() {
  const { colors, mode: themeMode } = useTheme();
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const router = useRouter();

  const [showAll, setShowAll] = useState(false);

  const params = useLocalSearchParams<{ key: string }>();
  const champion = useChampions().find((c) => c.key === params.key);
  const row = findTierRow(params.key);
  const augPool = useAugments();
  const items = useLocalizedData(itemData);

  const augById = new Map<string, Augment>(augPool.map((a) => [a.id, a]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  if (!champion || !row) return null;

  const tier = tierOf(params.key);

  /** 증강·아이템 공통 메타: 승률 + 표본수. */
  const meta = (e: TierEntry) => (
    <ThemedText type="caption" color="tertiary">
      {`${pct(e.score)} · ${e.games.toLocaleString()}${locale === 'ko' ? '' : ' '}${translate('games')}`}
    </ThemedText>
  );

  /**
   * 희귀도 그룹 — 2열 격자. 기본은 상위 PREVIEW_COUNT 개만, "모든 증강 보기"를 누르면 전량.
   *
   * 등급(S→D) 순으로 세운다. 행이 이미 승률 내림차순이고 sort 가 안정 정렬이라,
   * 티어로만 비교하면 같은 등급 안에서는 승률 순서가 그대로 남는다.
   */
  const augmentGroup = (rarity: (typeof RARITIES)[number]) => {
    const list = row.augments
      .map(([i, , tier]) => ({ aug: augById.get(augSlugs[i]), tier }))
      .filter((e): e is { aug: Augment; tier: number } => e.aug?.rarity === rarity)
      .sort((a, b) => a.tier - b.tier);
    if (!list.length) return null;
    const shown = showAll ? list : list.slice(0, PREVIEW_COUNT);
    return (
      <View key={rarity} style={styles.group}>
        <ThemedText type="label" color="secondary">
          {translate(RARITY_KEY[rarity])}
        </ThemedText>
        <View style={styles.grid}>
          {shown.map(({ aug, tier }) => {
            const badge = augTierOf(tier);
            const badgeColor = TierColors[themeMode][badge];
            return (
              <View
                key={aug.id}
                style={[
                  styles.augCard,
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
                      styles.augBadge,
                      {
                        // 테두리는 아이콘과 같은 희귀도색 — 배지가 타일에 이어 붙은 것처럼 보인다.
                        // AugmentTile 과 같은 팔레트를 직접 쓴다(타일 배경이 모드 무관 어두운 톤).
                        borderColor: AugmentRarityColors[rarity].border,
                        backgroundColor: colors.surface.sunken,
                      },
                    ]}
                  >
                    <ThemedText type="caption" style={[styles.augBadgeText, { color: badgeColor }]}>
                      {badge}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="caption" numberOfLines={2} style={styles.augName}>
                  {aug.name}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const source = translate('source')
    .replace('{patch}', tierlistMeta.patch)
    .replace('{date}', tierlistMeta.date);

  return (
    <>
      <Stack.Screen
        options={{
          // 챔피언 이름은 본문 헤더에 이미 있다 — large title 까지 이름이면 두 번 나온다.
          title: translate('screenTitle'),
          // select-champion-modal 과 같은 native large title. iOS 가 스크롤에 맞춰
          // large → inline 전환과 blur 재질을 알아서 처리한다.
          headerLargeTitle: true,
          headerLargeTitleStyle: { fontSize: 28 },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Image source="sf:xmark" style={styles.headerIcon} tintColor={colors.text.secondary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* 챔피언 헤더 */}
        <View style={styles.header}>
          <RemoteImage
            uri={championSquareUrl(champion.imageKey)}
            style={[
              styles.portrait,
              { borderColor: tier ? TierColors[themeMode][tier] : colors.border.default },
            ]}
            recyclingKey={champion.id}
          />
          <View style={styles.headerBody}>
            <View style={styles.titleRow}>
              {tier ? (
                <LinearGradient
                  // 티어리스트 배너와 같은 결 — 등급색을 좌우로 흘리고 글자는 흰색.
                  colors={[
                    `${TierColors[themeMode][tier]}1A`,
                    `${TierColors[themeMode][tier]}A6`,
                    `${TierColors[themeMode][tier]}1A`,
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.tierBadge, { borderColor: `${TierColors[themeMode][tier]}66` }]}
                >
                  <ThemedText type="label" style={[styles.tierMark, { color: colors.text.primary }]}>
                    {tier}
                  </ThemedText>
                </LinearGradient>
              ) : null}
              <ThemedText type="heading">{champion.name}</ThemedText>
            </View>
            <ThemedText type="caption" color="secondary">
              {champion.tags.map((tag) => CHAMPION_TAG_LABELS[locale][tag] ?? tag).join(' · ')}
            </ThemedText>
            <ThemedText type="label" color="accent">
              {`${translate('winRate')} ${pct(row.score)}`}
              <ThemedText type="label" color="secondary">
                {` · ${translate('pickRate')} ${pct(row.sub)}`}
              </ThemedText>
            </ThemedText>
          </View>
        </View>

        <ThemedText type="heading" style={styles.sectionTitle}>
          {translate('augments')}
        </ThemedText>
        {RARITIES.map(augmentGroup)}
        {showAll ? null : (
          <Pressable
            onPress={() => setShowAll(true)}
            style={[
              styles.showAll,
              { backgroundColor: colors.surface.raised, borderColor: colors.border.subtle },
            ]}
          >
            <ThemedText type="label" color="secondary">
              {translate('showAll')}
            </ThemedText>
          </Pressable>
        )}

        <ThemedText type="heading" style={styles.sectionTitle}>
          {translate('items')}
        </ThemedText>
        <View style={styles.group}>
          {row.items.map((e) => {
            const item = itemById.get(e.id);
            if (!item) return null;
            return (
              <DetailCardRow
                key={e.id}
                accentColor={colors.border.strong}
                icon={
                  <RemoteImage
                    uri={cdragonItemIconUrl(item.iconPath)}
                    size={44}
                    recyclingKey={e.id}
                    style={styles.itemIcon}
                  />
                }
                title={item.name}
                meta={meta(e)}
              />
            );
          })}
        </View>

        <ThemedText type="caption" color="tertiary" style={styles.source}>
          {source}
        </ThemedText>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  headerIcon: {
    width: 18,
    height: 18,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  portrait: {
    // 옆 headerBody 높이에 맞춰 늘어난다(부모 alignItems: 'center' 를 덮는다).
    alignSelf: 'stretch',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  headerBody: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tierBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierMark: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    paddingTop: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  augCard: {
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
  augName: {
    flex: 1,
  },
  augBadge: {
    position: 'absolute',
    // 아이콘 폭 기준 가운데. 부모 View 는 아이콘에 딱 맞는 크기다.
    left: (AUG_ICON - AUG_BADGE) / 2,
    // 아이콘 밖으로 절반 가까이 빼서 아이콘을 덜 가린다(카드 padding 8 안에 들어가는 한도).
    bottom: -8,
    // 원형이라 폭·높이를 같게 고정한다(글자가 한 자라 늘어날 일이 없다).
    width: AUG_BADGE,
    height: AUG_BADGE,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  augBadgeText: {
    fontWeight: '800',
    fontSize: 10,
    lineHeight: 14,
  },
  showAll: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.double,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
  },
  group: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  itemIcon: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  source: {
    paddingTop: Spacing.three,
    lineHeight: 16,
  },
});
