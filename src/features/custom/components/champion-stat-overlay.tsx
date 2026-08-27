/**
 * ChampionStatOverlay — 챔피언 정보 + 담은 아이템 합산 스탯을 띄우는 오버레이.
 *
 * 뼈대는 ChampionChangeOverlay 와 같다(배경 탭으로 닫기, 글라스 시트, 세로 inset 은
 * 먹지 않는다 — 먹으면 시트가 화면 한가운데가 아니게 된다).
 *
 * 스탯 표는 빌드 상세·아이템 선택 화면과 같은 ItemStatPanel 을 그대로 쓴다. 가로
 * 화면에선 항목이 시트 높이를 넘으므로 스크롤에 태운다.
 */
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { GlassSurface } from "@/components/ui/glass-surface";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { Champion } from "@/features/champions/types";
import { ItemStatPanel } from "@/features/items/components/item-stat-panel";
import type { Item } from "@/features/items/types";
import { useTheme } from "@/hooks/use-theme";
import { championSquareUrl } from "@/lib/ddragon";
import { CHAMPION_TAG_LABELS, useTranslation } from "@/lib/i18n";

const t = {
  ko: { title: "스탯", ...CHAMPION_TAG_LABELS.ko },
  en: { title: "Stats", ...CHAMPION_TAG_LABELS.en },
};

const CHAMP_ICON = 38;

interface Props {
  champion: Champion;
  items: Item[];
  onClose: () => void;
}

export function ChampionStatOverlay({ champion, items, onClose }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t) as (key: string) => string;

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.surface.overlay }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <SafeAreaView
        style={styles.safe}
        edges={["left", "right"]}
        pointerEvents="box-none"
      >
        <GlassSurface
          glassStyle="regular"
          style={[styles.sheet, { borderColor: colors.border.subtle }]}
        >
          <View style={styles.header}>
            <ThemedText type="label">{translate("title")}</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText type="label">✕</ThemedText>
            </Pressable>
          </View>

          <View
            style={[styles.champRow, { borderBottomColor: colors.border.subtle }]}
          >
            <RemoteImage
              uri={championSquareUrl(champion.imageKey)}
              recyclingKey={champion.id}
              style={[styles.champIcon, { borderColor: colors.accent.default }]}
              contentFit="cover"
            />
            <View style={styles.champMeta}>
              <ThemedText type="label" numberOfLines={1}>
                {champion.name}
              </ThemedText>
              {/* 여기는 스탯 표의 머리말이다 — 타이틀·태그를 한 줄로 합쳐
                  챔피언 소개가 표보다 커 보이지 않게 한다. */}
              <ThemedText color="tertiary" numberOfLines={1} style={styles.champSub}>
                {[champion.title, ...champion.tags.map((tag) => translate(tag))].join(
                  " · ",
                )}
              </ThemedText>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ItemStatPanel
              baseStats={champion.stats}
              itemStatsList={items.map((it) => it.stats)}
            />
          </ScrollView>
        </GlassSurface>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill },
  safe: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
  },

  sheet: {
    // 스탯 표는 한 컬럼이라 챔피언 선택 시트만큼 넓을 이유가 없다. 넓히면 항목명과
    // 값이 양 끝으로 벌어져(행이 space-between) 읽는 눈이 가로로 멀리 튄다.
    width: "42%",
    height: "90%",
    borderWidth: 1,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  champRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
  },
  champIcon: {
    width: CHAMP_ICON,
    height: CHAMP_ICON,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  champMeta: { flex: 1, minWidth: 0, gap: 1 },
  champSub: { fontSize: 10, lineHeight: 13 },

  scroll: { flex: 1 },
  // 리스트가 시트 끝까지 흐르도록 하단은 스크롤 안에서 띄운다.
  scrollContent: { paddingBottom: Spacing.four },
});
