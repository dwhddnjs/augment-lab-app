/**
 * TierlistScreen — 칼바람 챔피언 티어표.
 *
 * 네이티브 검색바(large title 헤더) + S~D 티어 배너 + 2열 격자. 챔피언을 누르면 상세 모달.
 *
 * 칼바람 전용이다 — tiers.ts 주석 참고. 모드 세그먼트는 없다.
 */
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

import { ThemedText } from '@/components/themed/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { TierMark } from '@/features/tierlist/components/tier-mark';
import { TierlistChampionCell } from '@/features/tierlist/components/tierlist-champion-cell';
import { COLUMNS, formatSource, tierSections } from '@/features/tierlist/tiers';
import { useTheme } from '@/hooks/use-theme';
import { matchName } from '@/lib/hangul';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: {
    searchPlaceholder: '챔피언 검색 (초성 가능)',
    empty: '검색 결과가 없습니다',
    source:
      'aram.gg 집계 · 패치 {patch} · {date} 기준\n티어는 aram.gg 자체 등급(승률·픽률 종합)을 그대로 씁니다. 챔피언 승률·픽률은 칼바람 광란(아수라장) 기준 중국(텐센트) 서버 통계, 증강 승률은 이용자 클라이언트가 업로드한 표본입니다. 아이템은 일반 칼바람(ARAM) 통계입니다. 표본 편향이 있을 수 있습니다.',
  },
  en: {
    searchPlaceholder: 'Search champions',
    empty: 'No champions found',
    source:
      'Data by aram.gg · Patch {patch} · as of {date}\nTiers are aram.gg\'s own grades (win rate + pick rate combined). Champion win/pick rates are from ARAM Mayhem on CN (Tencent) servers; augment win rates come from user-uploaded samples. Item stats are from standard ARAM. Sampling bias may apply.',
  },
};

/** 격자·배너 공통 좌우 인셋. */
const INSET = Spacing.three;

export function TierlistScreen() {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const champions = useChampions();
  const searchRef = useRef<SearchBarCommands>(null);
  const [query, setQuery] = useState('');

  const byKey = new Map(champions.map((c) => [c.key, c]));
  // 티어 배정은 전체 순위 기준 — 검색은 보여줄 챔피언만 고른다(tiers.ts 참고).
  const sections = tierSections((row) => {
    const champion = byKey.get(row.key);
    return champion != null && matchName(champion.name, query);
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            ref: searchRef,
            placeholder: translate('searchPlaceholder'),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            hideWhenScrolling: true,
            textColor: colors.text.primary,
            tintColor: colors.accent.default,
          },
        }}
      />

      {/* SectionList 가 화면 루트여야 native large title collapse 와 검색바 inset 이
          동작한다(flex View 로 감싸면 헤더 연동이 깨진다 — champion-select-grid 와 같은 이유). */}
      <SectionList
        sections={sections}
        keyExtractor={(row, i) => `${row[0]?.key ?? 'empty'}-${i}`}
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        // 검색 active(취소버튼) 상태로 스크롤하면 inline 타이틀이 안 뜬다 — 그래서 검색을 끝내는데,
        // cancelSearch 는 네이티브에서 검색어를 "" 로 지운다(RNSSearchBar.mm). 검색어가 있을 때
        // 그러면 결과를 스크롤하려는 순간 전체 목록으로 돌아가므로, 그때는 키보드만 내린다.
        onScrollBeginDrag={() =>
          query ? searchRef.current?.blur() : searchRef.current?.cancelSearch()
        }
        renderSectionHeader={({ section }) => (
          <TierMark
            tier={section.title}
            type="heading"
            style={[styles.banner, { backgroundColor: colors.surface.raised }]}
          />
        )}
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map((entry) => {
              const champion = byKey.get(entry.key);
              return champion ? (
                <TierlistChampionCell key={entry.key} champion={champion} row={entry} />
              ) : null;
            })}
            {/* 덜 찬 마지막 행의 빈 칸 — 없으면 마지막 카드가 폭 전체로 늘어난다. */}
            {Array.from({ length: COLUMNS - row.length }, (_, i) => (
              <View key={i} style={styles.filler} />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <ThemedText type="body" color="tertiary" style={styles.empty}>
            {translate('empty')}
          </ThemedText>
        }
        ListFooterComponent={
          <ThemedText type="caption" color="tertiary" style={styles.source}>
            {formatSource(translate('source'))}
          </ThemedText>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing.five,
  },
  banner: {
    height: Spacing.five,
    marginHorizontal: INSET,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    // 캡슐이므로 borderCurve 없음 — continuous 는 둥근 사각형에만 의미가 있다.
    borderRadius: Radius.full,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: INSET,
    paddingBottom: Spacing.two,
  },
  filler: {
    flex: 1,
    // 셀(TierlistChampionCell)과 같은 padding 이어야 폭이 같다 — Yoga 는 flexBasis 0 을 padding 만큼
    // 올린 뒤 남은 폭을 나눠서, padding 없는 빈 칸 옆의 셀이 그만큼 넓어진다.
    padding: Spacing.two,
  },
  empty: {
    paddingTop: Spacing.five,
    textAlign: 'center',
  },
  source: {
    paddingHorizontal: INSET,
    paddingTop: Spacing.four,
  },
});
