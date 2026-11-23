/**
 * StartCard — 홈 맨 위 시작 카드. 헤드라이너 타일을 누르면 그 헤드라이너로 고정해 드래프트를 시작한다.
 * 드래프트 이벤트가 있는 헤드라이너가 앞에, 설명만 있는 것은 뒤에 선다.
 * 랜덤 시작은 여기 두지 않는다 — 탭바 + → 칼바람이 같은 동작이라 한 화면에 두 개가 되고, 그러면 + 쪽은 쓰이지 않는다.
 * 앞 타일들의 색이 위에서 무대 조명처럼 내리꽂는다. 카드 위는 모드 무관 어두운 톤이다.
 */
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import {
  HeadlinerColors,
  HeroOverlay,
  Radius,
  Spacing,
  StageAlpha,
  Theme,
} from "@/constants/theme";
import { HEADLINER_LOGOS, logoBoxHeight } from "@/features/headliners/assets";
import { useHeadlinerTexts } from "@/features/headliners/hooks/use-headliners";
import { DRAFT_EVENT_IDS, HEADLINER_IDS } from "@/features/headliners/rules";
import type { HeadlinerId } from "@/features/headliners/types";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    title: "헤드라이너 선택",
    pick: "{name}(으)로 시작",
  },
  en: {
    title: "Choose a headliner",
    pick: "Start with {name}",
  },
};

const PAD = Spacing.three + Spacing.half;
/** 가장 긴 이름(HEARTSTEEL·귀염둥이 카페)이 caption 그대로 들어가는 폭. 넷째 타일이 카드 끝에 살짝 걸친다. */
const TILE_W = 96;
const TILE_H = 92;
const LOGO = 40;
const ON_DARK = Theme.dark;

/** 드래프트 이벤트가 있는 헤드라이너 먼저, 설명만 있는 것은 뒤로. 각 묶음 안은 등장 순서다. */
const LINEUP: HeadlinerId[] = [
  ...HEADLINER_IDS.filter((id) => DRAFT_EVENT_IDS.includes(id)),
  ...HEADLINER_IDS.filter((id) => !DRAFT_EVENT_IDS.includes(id)),
];

/** 카드 윗변 바깥에서 아래로 번지는 조명 — 처음 보이는 헤드라이너 넷의 색이다. */
const STAGE_LIGHTS = LINEUP.slice(0, 4).map((id) => HeadlinerColors[id])
  .map((color, i, colors) => {
    const x = Math.round(((i + 0.5) / colors.length) * 100);
    return `radial-gradient(34% 70% at ${x}% -14%, ${color}${StageAlpha.light} 0%, ${color}00 100%)`;
  })
  .join(", ");

interface Props {
  /** 그 헤드라이너로 고정해 시작한다. */
  onStart: (headliner: HeadlinerId) => void;
}

export function StartCard({ onStart }: Props) {
  const translate = useTranslation(t);
  const texts = useHeadlinerTexts();

  return (
    <View
      style={[
        styles.card,
        // no-repeat — 기본 반복이면 다음 장의 윗줄(조명 색)이 아랫변에 한 줄 비친다.
        { experimental_backgroundImage: STAGE_LIGHTS, experimental_backgroundRepeat: "no-repeat" },
      ]}
    >
      <ThemedText type="body" style={[styles.title, { color: HeroOverlay.textPrimary }]}>
        {translate("title")}
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // 카드 가장자리까지 넘어가게 카드 여백만큼 바깥으로 뺀다(둥근 모서리에서 잘린다).
        style={styles.lineup}
        contentContainerStyle={styles.lineupContent}
      >
        {LINEUP.map((id) => {
          const { name } = texts.headliners[id];
          const { source, small, aspect = 1 } = HEADLINER_LOGOS[id];
          // 투명 여백을 뺀 그림이 LOGO 가 되게 상자를 키운다(빌드 카드·드래프트 헤더와 같은 logoBoxHeight).
          // 안 그러면 여백이 큰 bees·커맨드 라인만 2할쯤 작아 보인다. 그림 칸(art)보다 큰 상자는 위아래로 넘친다.
          // 가로로 긴 로고(K/DA)는 타일 폭에 맞춰 줄인다.
          const logoW = Math.min(logoBoxHeight(id, LOGO) * aspect, TILE_W - Spacing.double);
          return (
            <Tile
              key={id}
              color={HeadlinerColors[id]}
              name={name}
              a11y={translate("pick").replace("{name}", name)}
              onPress={() => onStart(id)}
            >
              <Image
                source={small ?? source}
                style={{ width: logoW, height: logoW / aspect }}
                contentFit="contain"
              />
            </Tile>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface TileProps {
  /** 타일 안쪽 빛과 이름 색. */
  color: string;
  name: string;
  a11y: string;
  onPress: () => void;
  children: ReactNode;
}

/** 시작 타일 한 칸 — 로고(아이콘) + 이름, 안쪽 위에서 그 색이 은은하게 비친다. */
function Tile({ color, name, a11y, onPress, children }: TileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.tile,
        {
          experimental_backgroundImage: `radial-gradient(circle at 50% 30%, ${color}${StageAlpha.wash} 0%, ${color}00 70%)`,
          experimental_backgroundRepeat: "no-repeat",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* 그림 칸 높이를 고정한다 — 가로로 긴 로고(K/DA)는 납작해서, 그대로 두면 이름이 옆 타일보다 위로 올라간다. */}
      <View style={styles.art}>{children}</View>
      <ThemedText type="caption" numberOfLines={1} style={[styles.name, { color }]}>
        {name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xxl,
    borderCurve: "continuous",
    overflow: "hidden",
    padding: PAD,
    // 제목(body 16/24)은 줄 높이 여백 4pt + 한글 글리프 윗여백만큼 글자가 아래에서 시작한다.
    // 위를 그만큼(약 6pt) 덜어 내야 카드 윗변↔제목, 타일↔카드 아랫변이 눈으로 같아진다.
    paddingTop: Spacing.double,
    // 제목 아래도 줄 높이 여백(4pt)이 붙어 12pt 간격이 17pt 로 보였다 — 8pt 로 줄여 제목이 목록에 붙어 보이게 한다.
    gap: Spacing.two,
    backgroundColor: HeroOverlay.cardBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HeroOverlay.tileBorder,
  },
  title: {
    fontWeight: "800",
  },
  lineup: {
    marginHorizontal: -PAD,
  },
  lineupContent: {
    paddingHorizontal: PAD,
    gap: Spacing.two,
  },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HeroOverlay.tileBorder,
    backgroundColor: ON_DARK.glass.fill,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  art: {
    height: LOGO,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  // caption(12pt)보다 한 단계 작게 — 로고가 주인공이고 이름은 받쳐 주는 글자다.
  name: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
});
