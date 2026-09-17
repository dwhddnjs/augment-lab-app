/**
 * TierlistChampionScreen — 티어리스트 챔피언 상세(모달).
 *
 * 챔피언 지표 + 어울리는 증강(희귀도 3그룹) + 아이템(빌드 순서·상황별 + 스펠). 칼바람 전용이다.
 * 격자·배지 조각은 `features/tierlist/components` 에 있고 여기서는 데이터를 골라 넘기기만 한다.
 */
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { RemoteImage } from '@/components/ui/remote-image';
import { ModalLargeTitleStyle, Radius, Spacing, TierColors, Typography } from '@/constants/theme';
import { useAugmentPool } from '@/features/augments/hooks/use-augments';
import type { Augment } from '@/features/augments/types';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { TierGradient } from '@/features/tierlist/components/tier-gradient';
import { TierlistAugmentGrid } from '@/features/tierlist/components/tierlist-augment-grid';
import { TierlistItemGrid } from '@/features/tierlist/components/tierlist-item-grid';
import { TierlistSpellPill } from '@/features/tierlist/components/tierlist-spell-pill';
import { augSlugs, findTierRow, pct } from '@/features/tierlist/tiers';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { championSquareUrl } from '@/lib/ddragon';
import { CHAMPION_TAG_LABELS, useTranslation } from '@/lib/i18n';

const t = {
  ko: {
    screenTitle: '챔피언 정보',
    close: '닫기',
    notFound: '이 챔피언의 티어 정보가 없습니다',
    showAll: '모든 증강 보기',
    showLess: '증강 접기',
    augments: '증강',
    items: '아이템',
    buildOrder: '빌드 순서',
    situational: '상황별 아이템',
    silver: '실버',
    gold: '골드',
    prismaticRarity: '프리즘',
    winRate: '승률',
    pickRate: '픽률',
  },
  en: {
    screenTitle: 'Champion Info',
    close: 'Close',
    notFound: 'No tier data for this champion',
    showAll: 'Show all augments',
    showLess: 'Show fewer augments',
    augments: 'Augments',
    items: 'Items',
    buildOrder: 'Build Order',
    situational: 'Situational',
    silver: 'Silver',
    gold: 'Gold',
    prismaticRarity: 'Prismatic',
    winRate: 'Win',
    pickRate: 'Pick',
  },
};

/** 프리즘 → 골드 → 실버. 등급이 높은 쪽을 먼저 보여준다. */
const RARITIES = ['prismatic', 'gold', 'silver'] as const;

/** 희귀도별 기본 노출 개수. 나머지는 "모든 증강 보기"로 펼친다. */
const PREVIEW_COUNT = 6;
/**
 * 펼칠 때 희귀도마다 한 번에 더 붙이는 카드 수와 그 간격. 챔피언당 증강 74~157개를 한 프레임에
 * 마운트하면 끊겨 보여서, 그룹당 12개(최대 36카드)씩 나눠 붙이고 새 카드는 페이드로 띄운다.
 * 가장 큰 그룹이 61개라 5~6단계, 0.3초 안팎에 다 펼쳐진다.
 */
const EXPAND_STEP = 12;
const EXPAND_INTERVAL_MS = 50;

const RARITY_KEY = {
  silver: 'silver',
  gold: 'gold',
  prismatic: 'prismaticRarity',
} as const;

/** 챔피언 이름 옆 티어 배지 한 변. heading(20/28) 한 줄 안에 들어간다. */
const TIER_BADGE = 26;
/** 본문 하단 여백 — 마지막 아이템 줄이 홈 인디케이터에 붙지 않고 넉넉히 떠 있게. */
const BOTTOM_INSET = 120;

/**
 * 모달 라우트는 다른 챔피언으로 다시 열려도 params 만 바뀐 채 같은 화면이 재사용된다
 * (dangerouslySingular·딥링크 navigate). key 로 새로 마운트해 펼침 개수·스크롤 위치가 넘어가지 않게 한다.
 */
export function TierlistChampionScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return <ChampionDetail key={key} championKey={key} />;
}

function ChampionDetail({ championKey }: { championKey: string }) {
  const { colors, mode: themeMode } = useTheme();
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const router = useRouter();

  /** 희귀도 그룹마다 보여줄 개수. PREVIEW_COUNT 보다 크면 펼친 상태다. */
  const [limit, setLimit] = useState(PREVIEW_COUNT);
  const expanded = limit > PREVIEW_COUNT;
  const scrollRef = useRef<ScrollView>(null);
  /**
   * 본문 최상단의 contentOffset.y. large title 헤더가 있으면 iOS 가 inset 을 늘려 0 이 아니라
   * 음수다 — scrollTo({ y: 0 }) 는 헤더가 접힌 위치라 챔피언 헤더가 내비게이션 바에 가린다.
   * JS 로는 그 inset 을 받을 수 없어서(스크롤 이벤트의 contentInset 도 조정 전 값이다), 모달이 최상단에서
   * 열린다는 점을 이용해 드래그가 시작된 위치를 기록한다. 드래그 없이 먼저 내려간 경우(VoiceOver 초점 이동)를
   * 거르려고 0 이하일 때만 받는다. 음수로 가려면 scrollToOverflowEnabled 가 필요하다(RN 이 inset 0 기준으로 자른다).
   */
  const topY = useRef<number | null>(null);

  const champion = useChampions().find((c) => c.key === championKey);
  const row = findTierRow(championKey);
  // 칼바람 풀만 — 클래식 전용 증강이 추천에 섞이면 앱 뽑기 풀과 어긋난다.
  const augPool = useAugmentPool('aram');

  // 앱이 꺼진 상태에서 딥링크로 열리면 뒤에 화면이 없다 — 그때는 티어리스트 탭으로 간다.
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/(tierlist)'));

  const augById = new Map<string, Augment>(augPool.map((a) => [a.id, a]));
  const augEntries = (row?.augments ?? []).flatMap(([i, , tier]) => {
    const aug = augById.get(augSlugs[i]);
    return aug ? [{ aug, tier }] : [];
  });
  /**
   * 희귀도 그룹(빈 그룹은 뺀다). 등급(S→D) 순으로 세운다. 행이 이미 승률 내림차순이고 sort 가 안정 정렬이라,
   * 티어로만 비교하면 같은 등급 안에서는 승률 순서가 그대로 남는다.
   */
  const groups = RARITIES.map((rarity) => ({
    rarity,
    list: augEntries.filter((e) => e.aug.rarity === rarity).sort((a, b) => a.tier - b.tier),
  })).filter((g) => g.list.length > 0);
  /** 가장 큰 희귀도 그룹의 크기 — 단계 펼침을 여기서 멈추고, PREVIEW_COUNT 이하면 펼칠 게 없어 버튼을 숨긴다. */
  const largest = Math.max(0, ...groups.map((g) => g.list.length));

  // 펼치기 시작하면 가장 큰 그룹이 다 보일 때까지 EXPAND_STEP 씩 늘린다. 접으면 limit 이 PREVIEW_COUNT 로
  // 돌아가 멈추고, 도중에 접어도 예약된 타이머는 cleanup 이 지운다.
  useEffect(() => {
    if (limit <= PREVIEW_COUNT || limit >= largest) return;
    const id = setTimeout(() => setLimit((n) => n + EXPAND_STEP), EXPAND_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [limit, largest]);

  // 챔피언을 못 찾아도 헤더(제목·닫기)는 있어야 모달을 빠져나갈 수 있다.
  const header = (
    <Stack.Screen
      options={{
        // 챔피언 이름은 본문 헤더에 이미 있다 — large title 까지 이름이면 두 번 나온다.
        title: translate('screenTitle'),
        // select-champion-modal 과 같은 native large title. iOS 가 스크롤에 맞춰
        // large → inline 전환과 blur 재질을 알아서 처리한다.
        headerLargeTitle: true,
        headerLargeTitleStyle: ModalLargeTitleStyle,
        headerLeft: () => (
          <Pressable
            onPress={close}
            hitSlop={Spacing.double}
            accessibilityRole="button"
            accessibilityLabel={translate('close')}
          >
            <Image source="sf:xmark" style={styles.headerIcon} tintColor={colors.text.secondary} />
          </Pressable>
        ),
      }}
    />
  );

  if (!champion || !row) {
    return (
      <>
        {header}
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.surface.base }}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
          <ThemedText type="body" color="tertiary" style={styles.notFound}>
            {translate('notFound')}
          </ThemedText>
        </ScrollView>
      </>
    );
  }

  const tierColor = TierColors[themeMode][row.tier];
  // 아이템 격자·스펠 pill 은 비면 스스로 숨는다 — 셋 다 비면 제목만 남지 않게 제목 행까지 뺀다.
  const hasItems = row.build.length > 0 || row.situational.length > 0 || row.spells.length > 0;

  return (
    <>
      {header}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        onScrollBeginDrag={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (topY.current == null && y <= 0) topY.current = y;
        }}
        scrollToOverflowEnabled
      >
        {/* 챔피언 헤더 */}
        <View style={styles.header}>
          <RemoteImage
            uri={championSquareUrl(champion.imageKey)}
            style={[styles.portrait, { borderColor: tierColor }]}
            recyclingKey={champion.id}
          />
          <View style={styles.headerBody}>
            <View style={styles.titleRow}>
              {/* 티어리스트 배너와 같은 결 — 등급색을 좌우로 흘리고 글자는 흰색. */}
              <TierGradient color={tierColor} style={styles.tierBadge}>
                <ThemedText type="label" style={[styles.tierMark, { color: colors.text.primary }]}>
                  {row.tier}
                </ThemedText>
              </TierGradient>
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

        {groups.length > 0 && (
          <ThemedText type="heading" style={styles.sectionTitle}>
            {translate('augments')}
          </ThemedText>
        )}
        {/* 기본은 상위 PREVIEW_COUNT 개만, "모든 증강 보기"를 누르면 limit 이 단계적으로 늘어 전량. */}
        {groups.map(({ rarity, list }) => (
          <TierlistAugmentGrid
            key={rarity}
            rarity={rarity}
            label={translate(RARITY_KEY[rarity])}
            entries={list.slice(0, limit)}
            fadeFrom={PREVIEW_COUNT}
          />
        ))}
        {largest > PREVIEW_COUNT && (
          <Pressable
            // 접을 때는 콘텐츠가 줄면서 ScrollView 가 끝으로 당겨져 이 버튼·아이템 섹션이 화면에 남는다.
            // 펼칠 때는 증강이 버튼 자리에서 쏟아지면 어지러워 맨 위로 올려 프리즘부터 차례로 보게 하고,
            // 첫 단계만 붙인다 — 나머지는 위 useEffect 가 나눠 붙인다.
            onPress={() => {
              if (expanded) {
                setLimit(PREVIEW_COUNT);
                return;
              }
              // 한 번도 끌지 않았다면 아직 최상단이다 — 옮길 필요가 없다.
              if (topY.current != null) {
                scrollRef.current?.scrollTo({
                  y: topY.current,
                  animated: true,
                });
              }
              setLimit(PREVIEW_COUNT + EXPAND_STEP);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            style={[
              styles.showAll,
              {
                backgroundColor: colors.surface.raised,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <ThemedText type="label" color="secondary" style={styles.showAllText}>
              {translate(expanded ? 'showLess' : 'showAll')}
            </ThemedText>
          </Pressable>
        )}

        {hasItems && (
          <>
            <View style={[styles.sectionTitle, styles.itemsTitle]}>
              <ThemedText type="heading">{translate('items')}</ThemedText>
              <TierlistSpellPill spells={row.spells} pick={row.spellPick} />
            </View>
            <TierlistItemGrid label={translate('buildOrder')} ids={row.build} />
            <TierlistItemGrid label={translate('situational')} ids={row.situational} />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    paddingBottom: BOTTOM_INSET,
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
    width: TIER_BADGE,
    height: TIER_BADGE,
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
  itemsTitle: {
    // 증강 섹션(버튼)과 한 단계 더 띄워 두 섹션이 갈려 보이게 — sectionTitle 의 16 을 덮는다.
    paddingTop: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  notFound: {
    paddingTop: Spacing.five,
    textAlign: 'center',
  },
});
