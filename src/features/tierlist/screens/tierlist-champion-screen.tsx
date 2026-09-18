/**
 * TierlistChampionScreen — 티어리스트 챔피언 상세(모달).
 *
 * 챔피언 지표 + 어울리는 증강(희귀도 3그룹) + 아이템(빌드 순서·상황별 + 스펠). 칼바람 전용이다.
 * 섹션은 `features/tierlist/components` 에 있고 여기서는 데이터를 골라 넘기기만 한다.
 */
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { ModalLargeTitleStyle, Spacing } from '@/constants/theme';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { TierlistAugmentSection } from '@/features/tierlist/components/tierlist-augment-section';
import { TierlistChampionHeader } from '@/features/tierlist/components/tierlist-champion-header';
import { TierlistItemSection } from '@/features/tierlist/components/tierlist-item-section';
import { useAugmentGroups } from '@/features/tierlist/hooks/use-augment-groups';
import { useScrollTopAnchor } from '@/features/tierlist/hooks/use-scroll-top-anchor';
import { findTierRow } from '@/features/tierlist/tiers';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: {
    screenTitle: '챔피언 정보',
    close: '닫기',
    notFound: '이 챔피언의 티어 정보가 없습니다',
  },
  en: {
    screenTitle: 'Champion Info',
    close: 'Close',
    notFound: 'No tier data for this champion',
  },
};

/** 본문 하단 여백 — 마지막 아이템 줄이 홈 인디케이터에 붙지 않고 넉넉히 떠 있게. */
const BOTTOM_INSET = 120;
const CLOSE_ICON = 18;

/**
 * 모달 라우트는 다른 챔피언으로 다시 열려도 params 만 바뀐 채 같은 화면이 재사용된다
 * (dangerouslySingular·딥링크 navigate). key 로 새로 마운트해 펼침 개수·스크롤 위치가 넘어가지 않게 한다.
 */
export function TierlistChampionScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return <ChampionDetail key={key} championKey={key} />;
}

function ChampionDetail({ championKey }: { championKey: string }) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const router = useRouter();
  const { ref: scrollRef, onScrollBeginDrag, scrollToTop } = useScrollTopAnchor();

  const champion = useChampions().find((c) => c.key === championKey);
  const row = findTierRow(championKey);
  const augmentGroups = useAugmentGroups(row);

  // 앱이 꺼진 상태에서 딥링크로 열리면 뒤에 화면이 없다 — 그때는 티어리스트 탭으로 간다.
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/(tierlist)'));

  return (
    <>
      {/* 챔피언을 못 찾아도 헤더(제목·닫기)는 있어야 모달을 빠져나갈 수 있다. */}
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
              <Image source="sf:xmark" style={styles.closeIcon} tintColor={colors.text.secondary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: colors.surface.base }}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        onScrollBeginDrag={onScrollBeginDrag}
        scrollToOverflowEnabled
      >
        {champion && row ? (
          <>
            <TierlistChampionHeader champion={champion} row={row} />
            <TierlistAugmentSection groups={augmentGroups} onExpand={scrollToTop} />
            <TierlistItemSection row={row} />
          </>
        ) : (
          <ThemedText type="body" color="tertiary" style={styles.notFound}>
            {translate('notFound')}
          </ThemedText>
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
  closeIcon: {
    width: CLOSE_ICON,
    height: CLOSE_ICON,
  },
  notFound: {
    paddingTop: Spacing.five,
    textAlign: 'center',
  },
});
