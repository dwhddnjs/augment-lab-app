/**
 * ItemSelectScreen — 아이템 선택 페이즈 (옵셔널)
 *
 * 레이아웃: 가로모드 / 좌6:우4
 *   좌: 카테고리 필터(아이콘 탭) + ARAM 아이템 그리드
 *   우: 챔피언 아이콘/이름 + 합산 스탯 + 3×2 슬롯 + 증강 칩
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { augmentImageUrl, championClassIconUrl, championSquareUrl, itemImageUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';
import { useChampions } from '@/features/champions/hooks/use-champions';
import type { Augment } from '@/features/augments/types';
import { useItems } from '../hooks/use-items';
import { ItemSlotGrid } from './item-slot-grid';
import { ItemStatPanel } from './item-stat-panel';
import { ItemTooltip } from './item-tooltip';
import type { Item } from '../types';

const ARAM_IDS: Set<string> = new Set(require('../data/aram-item-ids.json'));

const MAX_ITEMS = 6;
const NUM_COLS = 7;
const CELL_GAP = Spacing.one; // 4px

// ─── 아이템 카테고리 명시 지정 ───────────────────────────────────────────────
// 태그 기반 predicate보다 우선 적용. 여러 카테고리 가능.
const ITEM_CATEGORIES: Record<string, string[]> = {
  '2065': ['support'],   // 슈렐리아의 군가
  '2517': ['fighter'],   // 끝없는 갈망
  '2524': ['support'],   // 밴들파이프
  '3050': ['support'],   // 지크의 융합(명령)
  '3068': ['tank'],      // 태양불꽃 방패
  '3072': ['marksman'],  // 피바라기
  '3087': ['marksman'],  // 스태틱의 단검
  '3091': ['fighter'],   // 마법사의 최후
  '3107': ['support'],   // 구원
  '3109': ['support'],   // 기사의 맹세
  '3110': ['tank'],      // 얼어붙은 심장
  '3139': ['marksman'],  // 헤르메스의 시미터
  '3146': ['mage'],      // 마법공학 총검
  '3156': ['fighter'],   // 맬모셔스의 아귀
  '3190': ['support'],   // 강철의 솔라리 펜던트
  '3222': ['support'],   // 미카엘의 축복
  '3302': ['marksman'],  // 경계
  '3504': ['support'],   // 불타는 향로
  '3814': ['assassin'],  // 밤의 끝자락
  '4005': ['support'],   // 제국의 명령
  '4633': ['mage'],      // 균열 생성기
  '4646': ['mage'],      // 폭풍 쇄도
  '6616': ['support'],   // 흐르는 물의 지팡이
  '6617': ['support'],   // 월석 재생기
  '6620': ['support'],   // 헬리아의 메아리
  '6621': ['support'],   // 새벽심장
  '6664': ['tank'],      // 공허한 광휘
  '6672': ['marksman'],  // 크라켄 학살자
  '6692': ['fighter'],   // 월식
  '6697': ['assassin'],  // 오만 (Hubris)
  '3119': ['tank'],      // 혹한의 손길
  '3124': ['marksman'],  // 구인수의 격노검
};

/**
 * 아이템이 주어진 카테고리에 속하는지 판단.
 * - ITEM_CATEGORIES에 등록된 아이템은 그 목록만 사용
 * - 신발은 boots/all 탭에서만 노출
 * - 나머지는 tagFallback 사용
 */
function itemInCategory(item: Item, key: string, tagFallback: () => boolean): boolean {
  // 신발: boots탭과 all탭에서만 노출
  if (key !== 'boots' && key !== 'all' && item.tags.includes('Boots')) return false;
  // 명시 지정 우선
  const cats = ITEM_CATEGORIES[item.id];
  if (cats !== undefined) return cats.includes(key);
  // boots탭이면 Boots 태그로만 판단
  if (key === 'boots') return item.tags.includes('Boots');
  return tagFallback();
}

// ─── 필터 정의 ───────────────────────────────────────────────────────────────
type FilterDef = {
  key: string; ko: string; en: string;
  predicate: (item: Item) => boolean;
} & (
  | { iconType: 'mci'; icon: string }
  | { iconType: 'cdragon'; classTag: string }
);

const FILTERS: FilterDef[] = [
  {
    key: 'all', ko: '전체', en: 'All',
    predicate: () => true,
    iconType: 'mci', icon: 'apps',
  },
  {
    key: 'fighter', ko: '전사', en: 'Fighter',
    predicate: (i) => itemInCategory(i, 'fighter', () =>
      i.tags.includes('Damage') &&
      (i.tags.includes('Health') || i.tags.includes('LifeSteal') ||
       i.tags.includes('Mana') || i.tags.includes('Armor')) &&
      !i.tags.includes('CriticalStrike') &&
      !i.tags.includes('SpellDamage') &&
      !i.tags.includes('Aura') &&
      !i.tags.includes('Boots')
    ),
    iconType: 'cdragon', classTag: 'Fighter',
  },
  {
    key: 'marksman', ko: '원거리딜러', en: 'Marksman',
    predicate: (i) => itemInCategory(i, 'marksman', () =>
      i.tags.includes('CriticalStrike') && !i.tags.includes('Boots')
    ),
    iconType: 'cdragon', classTag: 'Marksman',
  },
  {
    key: 'assassin', ko: '암살자', en: 'Assassin',
    predicate: (i) => itemInCategory(i, 'assassin', () =>
      i.tags.includes('ArmorPenetration') &&
      !i.tags.includes('CriticalStrike') &&
      !i.tags.includes('Health') &&
      !i.tags.includes('SpellDamage') &&
      !i.tags.includes('Boots')
    ),
    iconType: 'cdragon', classTag: 'Assassin',
  },
  {
    key: 'mage', ko: '마법사', en: 'Mage',
    predicate: (i) => itemInCategory(i, 'mage', () =>
      (i.tags.includes('SpellDamage') || i.tags.includes('MagicPenetration')) &&
      !i.tags.includes('Boots')
    ),
    iconType: 'cdragon', classTag: 'Mage',
  },
  {
    key: 'tank', ko: '탱커', en: 'Tank',
    predicate: (i) => itemInCategory(i, 'tank', () =>
      !i.tags.includes('Damage') &&
      !i.tags.includes('CriticalStrike') &&
      !i.tags.includes('SpellDamage') &&
      !i.tags.includes('ArmorPenetration') &&
      !i.tags.includes('Boots') &&
      (i.tags.includes('Armor') || i.tags.includes('SpellBlock') ||
       i.tags.includes('Tenacity') || i.tags.includes('HealthRegen'))
    ),
    iconType: 'cdragon', classTag: 'Tank',
  },
  {
    key: 'support', ko: '서포터', en: 'Support',
    predicate: (i) => itemInCategory(i, 'support', () =>
      !i.tags.includes('Boots') && (
        i.tags.includes('Aura') ||
        i.tags.includes('SpellVamp') ||
        i.tags.includes('GoldPer') ||
        (i.tags.includes('ManaRegen') && !i.tags.includes('Damage') && !i.tags.includes('SpellDamage'))
      )
    ),
    iconType: 'cdragon', classTag: 'Support',
  },
  {
    key: 'boots', ko: '신발', en: 'Boots',
    predicate: (i) => itemInCategory(i, 'boots', () => i.tags.includes('Boots')),
    iconType: 'mci', icon: 'shoe-sneaker',
  },
];

type FilterKey = typeof FILTERS[number]['key'] | null;

const t = {
  ko: { title: '아이템 선택', skip: '건너뛰기', done: '완료', items: '아이템', augments: '증강' },
  en: { title: 'Item Select', skip: 'Skip', done: 'Done', items: 'Items', augments: 'Augments' },
};

function FilterIcon({ filter, color, size }: { filter: FilterDef; color: string; size: number }) {
  if (filter.iconType === 'cdragon') {
    const uri = championClassIconUrl(filter.classTag);
    if (uri) {
      return <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" tintColor={color} />;
    }
    return <MaterialCommunityIcons name="sword" size={size} color={color} />;
  }
  return (
    <MaterialCommunityIcons
      name={filter.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
      size={size}
      color={color}
    />
  );
}

// ─── 화면 진입 래퍼 (landscape 가드) ─────────────────────────────────────────
export function ItemSelectScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();

  const { picked: pickedJson, championId } = useLocalSearchParams<{
    picked: string;
    championId: string;
  }>();
  const pickedAugments: Augment[] = useMemo(
    () => (pickedJson ? JSON.parse(pickedJson) : []),
    [pickedJson]
  );

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }, [])
  );

  const [dims, setDims] = useState({ w: 0, h: 0 });
  const isLandscape = dims.w > dims.h && dims.w > 0;

  return (
    <ThemedView
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setDims({ w: width, h: height });
      }}
    >
      {isLandscape && (
        <ItemSelectContent
          translate={translate}
          colors={colors}
          router={router}
          pickedAugments={pickedAugments}
          championId={championId ?? ''}
          pickedJson={pickedJson ?? '[]'}
        />
      )}
    </ThemedView>
  );
}

// ─── 본체 ────────────────────────────────────────────────────────────────────
function ItemSelectContent({
  translate, colors, router, pickedAugments, championId, pickedJson,
}: {
  translate: (key: string) => string;
  colors: ReturnType<typeof useTheme>['colors'];
  router: ReturnType<typeof useRouter>;
  pickedAugments: Augment[];
  championId: string;
  pickedJson: string;
}) {
  const allItems = useItems();
  const champions = useChampions();
  const champion = useMemo(
    () => champions.find((c) => c.id === championId) ?? null,
    [champions, championId]
  );

  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tooltipItem, setTooltipItem] = useState<Item | null>(null);
  // body(flex row) 컨테이너 실측 너비 → 6:4 비율로 정확한 셀 크기 계산
  const [bodyWidth, setBodyWidth] = useState(0);

  const aramItems = useMemo(
    () => allItems.filter((item) => ARAM_IDS.has(item.id)),
    [allItems]
  );

  const displayItems = useMemo(() => {
    if (!activeFilter) return aramItems;
    const def = FILTERS.find((f) => f.key === activeFilter);
    return def ? aramItems.filter(def.predicate) : aramItems;
  }, [aramItems, activeFilter]);

  // 마지막 행 균등 크기를 위해 null로 패딩
  const paddedItems = useMemo((): (Item | null)[] => {
    const rem = displayItems.length % NUM_COLS;
    if (rem === 0) return displayItems;
    return [...displayItems, ...Array<null>(NUM_COLS - rem).fill(null)];
  }, [displayItems]);

  // body 실측 너비의 60%가 좌측 패널 → paddingLeft·divider 공간 제외 후 셀 크기
  const leftInner = bodyWidth > 0
    ? bodyWidth * 0.6 - Spacing.three - (Spacing.two * 2 + 1) // paddingLeft + divider(1+margin*2)
    : 0;
  const cellSize = leftInner > 0
    ? Math.max(36, Math.floor((leftInner - (NUM_COLS - 1) * CELL_GAP) / NUM_COLS))
    : 48;

  const selectedItems = useMemo(
    () => selectedIds.map((id) => aramItems.find((it) => it.id === id)!).filter(Boolean),
    [selectedIds, aramItems]
  );
  const itemStatsList = useMemo(() => selectedItems.map((it) => it.stats), [selectedItems]);

  const handleItemPress = (item: Item) => {
    setSelectedIds((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, item.id];
    });
  };

  const navigateToResult = (itemIds: string[]) => {
    router.replace({
      pathname: '/draft-result',
      params: { picked: pickedJson, championId, items: JSON.stringify(itemIds) },
    });
  };

  const championIconUri = champion ? championSquareUrl(champion.imageKey) : null;

  // 그리드: NUM_COLS씩 row로 묶기
  const rows = useMemo(() => {
    const result: (Item | null)[][] = [];
    for (let i = 0; i < paddedItems.length; i += NUM_COLS) {
      result.push(paddedItems.slice(i, i + NUM_COLS));
    }
    return result;
  }, [paddedItems]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border.subtle, borderBottomWidth: 1 }]}>
        <ThemedText type="heading">{translate('title')}</ThemedText>
        <ThemedText type="caption" color="tertiary">{selectedIds.length}/{MAX_ITEMS}</ThemedText>
        <View style={styles.headerSpacer} />
        <Pressable
          onPress={() => navigateToResult([])}
          style={[styles.btn, { backgroundColor: colors.surface.raised, borderColor: colors.border.default, borderWidth: 1 }]}
        >
          <ThemedText type="label" color="secondary">{translate('skip')}</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => navigateToResult(selectedIds)}
          style={[styles.btn, { backgroundColor: colors.accent.default }]}
        >
          <ThemedText type="label" style={{ color: colors.accent.onAccent }}>{translate('done')}</ThemedText>
        </Pressable>
      </View>

      {/* onLayout으로 body 실측 너비 측정 → 6:4 셀 크기 계산에 사용 */}
      <View style={styles.body} onLayout={(e) => setBodyWidth(e.nativeEvent.layout.width)}>
        {/* ── 좌(6): 필터 + 아이템 그리드 ── */}
        <View style={styles.leftPanel}>
          {/* 필터 아이콘 탭 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {FILTERS.map((f) => {
              const active = activeFilter === f.key || (f.key === 'all' && activeFilter === null);
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setActiveFilter(f.key === 'all' ? null : (active ? null : f.key))}
                  style={styles.filterTab}
                  hitSlop={10}
                >
                  <FilterIcon
                    filter={f}
                    color={active ? colors.accent.default : colors.text.tertiary}
                    size={22}
                  />
                  <View style={[styles.filterDot, { backgroundColor: active ? colors.accent.default : 'transparent' }]} />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 아이템 그리드 — 고정 셀 크기 + 빈 칸 패딩으로 마지막 행도 균등 */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={[styles.gridRow, { gap: CELL_GAP }]}>
                {row.map((item, colIdx) => {
                  if (!item) {
                    // 빈 칸: 동일 크기 투명 박스
                    return <View key={`ph-${colIdx}`} style={{ width: cellSize, height: cellSize }} />;
                  }
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleItemPress(item)}
                      style={({ pressed }) => ({
                        width: cellSize,
                        height: cellSize,
                        borderRadius: Radius.sm,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? colors.accent.default : colors.border.subtle,
                        backgroundColor: isSelected ? colors.accent.subtle : colors.surface.raised,
                        opacity: pressed ? 0.7 : 1,
                        justifyContent: 'center' as const,
                        alignItems: 'center' as const,
                        overflow: 'hidden' as const,
                      })}
                    >
                      <Image
                        source={{ uri: itemImageUrl(item.imageKey) }}
                        style={{ width: cellSize - 4, height: cellSize - 4, borderRadius: Radius.sm }}
                        contentFit="contain"
                      />
                      {isSelected && (
                        <View style={[styles.checkBadge, { backgroundColor: colors.accent.default }]}>
                          <ThemedText style={{ color: colors.accent.onAccent, fontSize: 8, lineHeight: 12 }}>✓</ThemedText>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── 구분선 ── */}
        <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

        {/* ── 우(4): View로 감싸 flex:4 강제, 내부 ScrollView ── */}
        <View style={styles.rightPanel}>
        <ScrollView style={styles.rightScroll} contentContainerStyle={styles.rightContent} showsVerticalScrollIndicator={false}>
          {champion && (
            <View style={[styles.championRow, { borderBottomColor: colors.border.subtle, borderBottomWidth: 1 }]}>
              {championIconUri && (
                <Image
                  source={{ uri: championIconUri }}
                  style={[styles.championIcon, { borderColor: colors.border.default, borderWidth: 1 }]}
                  contentFit="cover"
                />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <ThemedText type="body" color="primary" numberOfLines={1}>{champion.name}</ThemedText>
                <ThemedText type="caption" color="tertiary" numberOfLines={1}>{champion.title}</ThemedText>
                <ThemedText type="caption" color="disabled" numberOfLines={1}>{champion.tags.join(' · ')}</ThemedText>
              </View>
            </View>
          )}

          {champion && (
            <View style={{ marginTop: Spacing.two }}>
              <ItemStatPanel baseStats={champion.stats} itemStatsList={itemStatsList} />
            </View>
          )}

          <View style={{ marginTop: Spacing.two }}>
            <ThemedText type="caption" color="tertiary" style={{ marginBottom: Spacing.one }}>
              {translate('items')} ({selectedIds.length}/{MAX_ITEMS})
            </ThemedText>
            <ItemSlotGrid
              selectedItems={selectedItems}
              onSlotPress={(_i, item) => { if (item) setTooltipItem(item); }}
            />
          </View>

          {pickedAugments.length > 0 && (
            <View style={{ marginTop: Spacing.three }}>
              <ThemedText type="caption" color="tertiary" style={{ marginBottom: Spacing.one }}>
                {translate('augments')}
              </ThemedText>
              <View style={styles.augmentChips}>
                {pickedAugments.map((aug) => (
                  <View
                    key={aug.id}
                    style={[styles.augmentChip, { backgroundColor: colors.surface.raised, borderColor: colors.border.subtle, borderWidth: 1 }]}
                  >
                    <Image source={{ uri: augmentImageUrl(aug.iconPath, 'small') }} style={styles.augmentIcon} contentFit="contain" />
                    <ThemedText type="caption" color="secondary" numberOfLines={1} style={{ maxWidth: 60 }}>
                      {aug.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        </View>
      </View>

      {tooltipItem && <ItemTooltip item={tooltipItem} onClose={() => setTooltipItem(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerSpacer: { flex: 1 },
  btn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.xl,
  },

  body: { flex: 1, flexDirection: 'row' },

  leftPanel: {
    flex: 6,
    minWidth: 0,
    paddingLeft: Spacing.three,
    paddingTop: Spacing.two,
  },

  filterBar: {
    flexDirection: 'row',
    gap: Spacing.four,
    paddingBottom: Spacing.two,
    paddingRight: Spacing.two,
    alignItems: 'center',
  },
  filterTab: { alignItems: 'center', gap: 3 },
  filterDot: { width: 4, height: 4, borderRadius: Radius.full },

  gridContent: { gap: CELL_GAP, paddingBottom: Spacing.three },
  gridRow: { flexDirection: 'row' },

  checkBadge: {
    position: 'absolute',
    top: 1, right: 1,
    width: 12, height: 12,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: Spacing.two,
    marginVertical: Spacing.two,
  },

  rightPanel: { flex: 4, minWidth: 0 },
  rightScroll: { flex: 1 },
  rightContent: {
    paddingRight: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },

  championRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  championIcon: { width: 52, height: 52, borderRadius: Radius.md },

  augmentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  augmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  augmentIcon: { width: 16, height: 16 },
});
