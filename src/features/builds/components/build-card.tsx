/**
 * BuildCard — 홈 그리드의 저장된 빌드 카드 한 장(세로 컬렉션 카드).
 * 챔피언 splash(가운데 정렬판)가 카드를 채우고, 그 판의 헤드라이너 색은 테두리·그림자에만 묻힌다(그림은 가리지 않는다).
 * 왼쪽 위 배지는 헤드라이너 로고, 커스텀 빌드는 커스텀 아이콘이다(+ 메뉴의 커스텀과 같은 아이콘).
 * 둘 다 없는 빌드(헤드라이너 도입 전 칼바람)는 배지·색 없이 그린다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { AugmentTile } from "@/components/ui/augment-tile";
import { ThemedText } from "@/components/themed/themed-text";
import { LAUNCH_ICONS } from "@/constants/game-modes";
import {
  HeadlinerColors,
  HeroOverlay,
  Radius,
  Spacing,
  StageAlpha,
  Theme,
} from "@/constants/theme";
import { useAugments } from "@/features/augments/hooks/use-augments";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { HEADLINER_LOGOS } from "@/features/headliners/assets";
import { isHeadlinerId } from "@/features/headliners/rules";
import { useLocale } from "@/hooks/use-locale";
import type { SavedBuild } from "@/lib/build-storage";
import { resolveIds } from "@/lib/arrays";
import { championCenteredUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { dayLabel } from "../utils/date";

const t = {
  ko: { unknownChampion: "알 수 없는 챔피언", custom: "커스텀 빌드" },
  en: { unknownChampion: "Unknown champion", custom: "Custom build" },
};

/** 카드 가로:세로. centered splash(1280×720)를 높이 기준으로 채우면 가운데 챔피언 얼굴~상체가 남는 비율이다. */
export const BUILD_CARD_ASPECT = 0.7;
const PAD = Spacing.double;
const AUG_SIZE = 26;
const AUG_GAP = Spacing.one;
const BADGE_ICON = 18;
/** 배지 안 헤드라이너 로고. 로고는 그림이 상자를 꽉 채워서 아이콘보다 작게 둬야 원 안에 여백이 고르게 남는다. */
const BADGE_LOGO = 15;
/** 배지 지름. 정사각 아이콘(커스텀·대부분의 로고)은 원, 가로로 긴 로고(K/DA)만 캡슐로 늘어난다. */
const BADGE = 26;

/** 카드 조명색 — 커스텀은 민트, 헤드라이너는 그 색, 둘 다 없으면 없음. 카드 위는 모드 무관 어두운 톤이라 다크 토큰을 쓴다. */
function stageColor(build: SavedBuild): string | null {
  if (build.custom) return Theme.dark.accent.default;
  const id = build.headliner?.id;
  return id && isHeadlinerId(id) ? HeadlinerColors[id] : null;
}

interface Props {
  build: SavedBuild;
  width: number;
  onPress: () => void;
  onLongPress: () => void;
}

export function BuildCard({ build, width, onPress, onLongPress }: Props) {
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const champions = useChampions();
  const augments = useAugments();

  const champion = champions.find((c) => c.id === build.championId) ?? null;
  const buildAugments = resolveIds(build.augmentIds, augments);
  const tone = stageColor(build);

  // 한 줄에 들어가는 만큼만 그린다. 넘치면(보너스 라운드·전환 증강) 마지막 칸을 +n 으로 바꾼다.
  const fit = Math.floor((width - PAD * 2 + AUG_GAP) / (AUG_SIZE + AUG_GAP));
  const overflow = buildAugments.length > fit;
  const shown = overflow ? buildAugments.slice(0, fit - 1) : buildAugments;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={champion?.name}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View
        style={[
          styles.card,
          {
            width,
            height: width / BUILD_CARD_ASPECT,
            boxShadow: tone ? `0 6px 14px -8px ${tone}${StageAlpha.glow}` : undefined,
          },
        ]}
      >
        {champion && (
          <Image
            source={{ uri: championCenteredUrl(champion.id) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            recyclingKey={build.id}
            cachePolicy="memory-disk"
            transition={0}
          />
        )}

        {/* 그림은 가리지 않는다 — 글자가 놓이는 아래쪽에만 scrim 을 깐다(모드 무관). 조명색은 테두리·그림자에만 쓴다. */}
        <LinearGradient
          colors={HeroOverlay.scrimDark}
          locations={[0.52, 0.7, 0.85, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* 테두리는 그림 위에 따로 얹는다 — 카드 자체 border 는 그림 아래 깔려 가려진다. */}
        <View
          pointerEvents="none"
          style={[
            styles.edge,
            tone
              ? { borderWidth: 1, borderColor: `${tone}${StageAlpha.edge}` }
              : { borderWidth: StyleSheet.hairlineWidth, borderColor: HeroOverlay.tileBorder },
          ]}
        />

        <View style={styles.topRow}>
          <StageBadge build={build} label={translate("custom")} />
          <View style={styles.pill}>
            <ThemedText type="caption" style={[styles.pillText, { color: HeroOverlay.textPrimary }]}>
              {dayLabel(build.createdAt, locale)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.bottom}>
          <View>
            {champion && (
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={[styles.textShadow, { color: HeroOverlay.textSecondary }]}
              >
                {champion.title}
              </ThemedText>
            )}
            <ThemedText
              type="heading"
              numberOfLines={1}
              style={[styles.name, styles.textShadow, { color: HeroOverlay.textPrimary }]}
            >
              {champion ? champion.name : translate("unknownChampion")}
            </ThemedText>
          </View>

          {buildAugments.length > 0 && (
            <View style={styles.augRow}>
              {shown.map((aug, i) => (
                <AugmentTile
                  key={`${aug.id}-${i}`}
                  iconPath={aug.iconPath}
                  rarity={aug.rarity}
                  recyclingKey={aug.id}
                  size={AUG_SIZE}
                />
              ))}
              {overflow && (
                <View style={styles.moreTile}>
                  <ThemedText type="caption" style={{ color: HeroOverlay.textPrimary }}>
                    +{buildAugments.length - shown.length}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/** 왼쪽 위 배지 — 헤드라이너 로고 또는 커스텀 아이콘. 없으면 자리만 지켜 날짜가 오른쪽에 붙어 있게 한다. */
function StageBadge({ build, label }: { build: SavedBuild; label: string }) {
  if (build.custom) {
    return (
      <View style={styles.badge} accessible accessibilityLabel={label}>
        <MaterialCommunityIcons
          name={LAUNCH_ICONS.custom}
          size={BADGE_ICON}
          color={Theme.dark.accent.default}
        />
      </View>
    );
  }
  const id = build.headliner?.id;
  if (!id || !isHeadlinerId(id)) return <View />;
  // 판 위가 늘 어두워서 라이트 모드용 그림(light)·흰 로고 칠하기 없이 원본을 그린다.
  const { source, small, aspect = 1 } = HEADLINER_LOGOS[id];
  return (
    <View style={styles.badge}>
      <Image
        source={small ?? source}
        style={{ width: BADGE_LOGO * aspect, height: BADGE_LOGO }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: HeroOverlay.cardBase,
  },
  edge: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: Radius.xl,
    borderCurve: "continuous",
  },
  topRow: {
    position: "absolute",
    top: Spacing.two,
    left: Spacing.two,
    right: Spacing.two,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    height: BADGE,
    minWidth: BADGE,
    paddingHorizontal: (BADGE - BADGE_ICON) / 2,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HeroOverlay.tileBg,
  },
  // 날짜 — 배지와 높이를 맞춘 글자 캡슐.
  pill: {
    height: BADGE,
    minWidth: BADGE,
    paddingHorizontal: Spacing.one + Spacing.half,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HeroOverlay.tileBg,
  },
  // caption(12pt)은 26pt 원 배지 옆에서 커 보여 한 단계 줄인다.
  pillText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "600",
  },
  bottom: {
    position: "absolute",
    left: PAD,
    right: PAD,
    bottom: PAD,
    gap: Spacing.two,
  },
  name: {
    fontWeight: "800",
  },
  // scrim 이 옅은 윗줄(칭호)이 밝은 그림 위에 놓여도 읽히게.
  textShadow: {
    textShadowColor: HeroOverlay.scrimDark[3],
    textShadowRadius: 6,
  },
  augRow: {
    flexDirection: "row",
    gap: AUG_GAP,
  },
  moreTile: {
    width: AUG_SIZE,
    height: AUG_SIZE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: HeroOverlay.tileBorder,
    backgroundColor: HeroOverlay.tileBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
