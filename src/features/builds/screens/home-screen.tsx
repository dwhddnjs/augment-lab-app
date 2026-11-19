/**
 * HomeScreen — 홈 탭. 시작 카드(헤드라이너 골라 시작·랜덤 시작) → 최근 빌드 캐러셀 → (라우트가 넣어 주는) 지금 S티어.
 * 전체 빌드는 "전체 보기"로 내 빌드 그리드(BuildListScreen)에서 본다.
 * 화면 타이틀은 (home) 스택의 native large-title 헤더가 제공한다.
 *
 * S티어 줄은 티어리스트(다른 화면 도메인)의 것이라 여기서 import 하지 않고 라우트 파일이 footer 로 끼운다.
 */
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { MoreLink } from "@/components/ui/more-link";
import { BottomTabInset, Spacing } from "@/constants/theme";
import type { HeadlinerId } from "@/features/headliners/types";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";
import { BuildCard } from "../components/build-card";
import { StartCard } from "../components/start-card";
import { useBuilds } from "../hooks/use-builds";
import { useConfirmDelete } from "../hooks/use-confirm-delete";

const t = {
  ko: {
    recent: "최근 빌드",
    seeAll: "전체 보기",
    emptyHint: "빌드를 완료하면 여기에 쌓여요",
  },
  en: {
    recent: "Recent Builds",
    seeAll: "See All",
    emptyHint: "Finish a build to see it here",
  },
};

/** 캐러셀 카드 폭 — 세 번째 카드가 화면 끝에 걸쳐 옆으로 넘길 수 있다는 게 보인다. */
const RECENT_CARD = 148;
/** 캐러셀에 올리는 최근 빌드 수. 나머지는 전체 보기에서. */
const RECENT_COUNT = 8;

export function HomeScreen({ footer }: { footer?: ReactNode }) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const confirmDelete = useConfirmDelete();
  // null = 로딩 중 (깜빡임 없이 빈 상태와 구분).
  const builds = useBuilds();
  const recent = (builds ?? []).slice(0, RECENT_COUNT);

  // 헤드라이너를 고르면 챔피언 선택 → 드래프트까지 그 값을 나른다. 없으면 판마다 무작위.
  const startAram = (headliner?: HeadlinerId) => {
    router.push({
      pathname: "/select-champion-modal",
      params: { mode: "aram", ...(headliner && { headliner }) },
    });
  };

  return (
    <ScrollView
      // 헤더 바로 아래 루트 스크롤뷰여야 native large-title 이 스크롤에 맞춰 collapse 된다.
      style={{ flex: 1, backgroundColor: colors.surface.base }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StartCard onStart={startAram} />

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            {translate("recent")}
          </ThemedText>
          {recent.length > 0 && (
            <MoreLink label={translate("seeAll")} onPress={() => router.push("/builds")} />
          )}
        </View>

        {builds != null && recent.length === 0 && (
          <ThemedText type="caption" color="tertiary">
            {translate("emptyHint")}
          </ThemedText>
        )}

        {recent.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            // 화면 끝까지 넘어가게 본문 여백만큼 바깥으로 빼고, 안쪽에서 다시 채운다.
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
          >
            {recent.map((build) => (
              <BuildCard
                key={build.id}
                build={build}
                width={RECENT_CARD}
                onPress={() =>
                  router.push({ pathname: "/build/[id]", params: { id: build.id } })
                }
                onLongPress={() => confirmDelete(build)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.five - Spacing.one,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  section: {
    gap: Spacing.double,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "800",
  },
  carousel: {
    marginHorizontal: -Spacing.three,
    marginBottom: -Spacing.three,
  },
  carouselContent: {
    paddingHorizontal: Spacing.three,
    // 카드 아래로 번지는 조명 그림자가 스크롤뷰 경계에 잘리지 않게 아래를 비워 둔다.
    paddingBottom: Spacing.three,
    gap: Spacing.double,
  },
});
