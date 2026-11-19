/**
 * TopTierSection — 홈 "지금 S티어" 줄. S티어 전원을 소스 순서(동티어 승률순)로 가로로 넘긴다.
 * 누르면 티어리스트 챔피언 상세 모달, "티어리스트"는 티어리스트 탭으로 간다.
 */
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { tierRows } from "@/features/tierlist/tiers";
import { championSquareUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { useTierColors } from "../hooks/use-tier-colors";

const t = {
  ko: { title: "지금 S티어", more: "티어리스트" },
  en: { title: "S Tier Now", more: "Tier List" },
};

const AVATAR = 56;
/** 한 칸 폭 — 아바타에 이름 말줄임 여유만 더한다. 칸 사이는 GAP 만 벌어진다. */
const ITEM = AVATAR + Spacing.two;
const GAP = Spacing.one;
const TOP = tierRows().filter((r) => r.tier === "S");

export function TopTierSection() {
  const translate = useTranslation(t);
  const router = useRouter();
  const champions = useChampions();
  const tierColor = useTierColors().S;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <ThemedText type="heading" style={styles.title}>
          {translate("title")}
        </ThemedText>
        <Pressable onPress={() => router.navigate("/(tabs)/(tierlist)")} hitSlop={Spacing.two}>
          <ThemedText type="label" color="accent">
            {translate("more")}
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // 최근 빌드 캐러셀과 같이 화면 끝까지 넘어가게 본문 여백만큼 바깥으로 뺀다.
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {TOP.map((row) => {
          const champion = champions.find((c) => c.key === row.key);
          if (!champion) return null;
          return (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              style={styles.member}
              onPress={() =>
                router.push({ pathname: "/tierlist-champion-modal", params: { key: row.key } })
              }
            >
              <RemoteImage
                uri={championSquareUrl(champion.imageKey)}
                size={AVATAR}
                recyclingKey={champion.id}
                style={[styles.avatar, { borderColor: tierColor }]}
              />
              <ThemedText type="caption" color="secondary" numberOfLines={1}>
                {champion.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.double,
  },
  head: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: "800",
  },
  carousel: {
    marginHorizontal: -Spacing.three,
  },
  carouselContent: {
    paddingHorizontal: Spacing.three,
    gap: GAP,
  },
  member: {
    width: ITEM,
    alignItems: "center",
    gap: Spacing.one + Spacing.half,
  },
  avatar: {
    borderRadius: Radius.full,
    borderWidth: 2,
    overflow: "hidden",
  },
});
