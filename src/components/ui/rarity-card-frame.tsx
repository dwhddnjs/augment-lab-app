import { StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import { AugmentRarityGlyphs, Radius, Spacing } from "@/constants/theme";
import type { Augment, AugmentRarity } from "@/features/augments/types";
import { cleanAugmentDescription } from "@/lib/augment-text";

export interface RarityStyle {
  // Outer metallic rim — diagonal brushed-metal sheen.
  frameImage: string;
  outerGlow: string;
  // Body
  bodyColor: string;
  // Emblem
  iconTint: string;
  // Text
  title: string;
  desc: string;
  highlight: string;
}

// Each rarity is an intrinsic in-game palette (like the existing AugmentRarityColors),
// so the metallic/holographic hexes live here rather than in the app theme tokens.
// 칼바람·아레나 두 feature가 공유하는 순수 시각 컴포넌트라 components/ui로 승격했다.
export const RARITY: Record<AugmentRarity, RarityStyle> = {
  silver: {
    frameImage:
      "linear-gradient(135deg, #34383f 0%, #5b616a 15%, #818892 31%, #3f444c 50%, #6b7079 66%, #383c43 82%, #5e646d 100%)",
    outerGlow: "0 6px 22px rgba(0,0,0,0.6), 0 0 12px rgba(120,128,140,0.18)",
    bodyColor: "#0A0B0D",
    iconTint: "#E4E9F0",
    title: "#F4F6F9",
    desc: "#AEB4BD",
    highlight: "#E6EAF0",
  },
  gold: {
    frameImage:
      "linear-gradient(135deg, #5c481c 0%, #c9a64e 16%, #f7e9b8 30%, #98782e 48%, #e7c477 64%, #6a4f1f 82%, #d4ad44 100%)",
    outerGlow: "0 6px 22px rgba(0,0,0,0.55), 0 0 16px rgba(232,179,57,0.32)",
    bodyColor: "#0B0A07",
    iconTint: "#F2D98F",
    title: "#F4F6F9",
    desc: "#AEB4BD",
    highlight: "#F2C766",
  },
  prismatic: {
    frameImage:
      "linear-gradient(135deg, #ffc2e6 0%, #d9b8ff 19%, #ffffff 35%, #aee4ff 52%, #bafcd9 69%, #ffe0c4 85%, #f3c2ff 100%)",
    outerGlow: "0 6px 24px rgba(0,0,0,0.5), 0 0 18px rgba(198,161,255,0.45)",
    bodyColor: "#0B0A07",
    iconTint: "#f3c2ff",
    title: "#F4F6F9",
    desc: "#AEB4BD",
    highlight: "#7A4FC0",
  },
};

// Highlight gold/coin amounts inside the description (e.g. "250골드", "250 gold").
const AMOUNT_RE = /(\d[\d,]*\s*(?:골드|gold|원))/i;
function splitDescription(text: string): { text: string; hl: boolean }[] {
  return text
    .split(/(\d[\d,]*\s*(?:골드|gold|원))/gi)
    .filter((p) => p.length > 0)
    .map((p) => ({ text: p, hl: AMOUNT_RE.test(p) }));
}

interface Props {
  augment: Augment;
  cardWidth: number;
}

export function RarityCardFrame({ augment, cardWidth }: Props) {
  const rs = RARITY[augment.rarity];

  const cardHeight = Math.round(cardWidth * (14 / 9));
  const framePad = Math.max(3, Math.round(cardWidth * 0.056)); // 카드 태두리 크키 조절

  const iconSize = 72; // 증강 아이콘 사이즈;

  const nameSize = 12;
  const descSize = 8;

  const segments = splitDescription(
    cleanAugmentDescription(augment.description),
  );

  return (
    <View
      style={[
        styles.frame,
        {
          width: cardWidth,
          height: cardHeight,
          padding: framePad,
          borderRadius: Radius.lg + 3,
          experimental_backgroundImage: rs.frameImage,
          boxShadow: rs.outerGlow,
        },
      ]}
    >
      <View style={[styles.body, { backgroundColor: rs.bodyColor }]}>
        <View style={styles.content}>
          {/* Emblem with soft halo */}
          <View style={[styles.iconArea, { marginBottom: Spacing.one }]}>
            <AugmentImage
              iconPath={augment.iconPath}
              size={iconSize}
              tint={rs.iconTint}
              fallbackGlyph={AugmentRarityGlyphs[augment.rarity]}
              recyclingKey={augment.id}
            />
          </View>
          {/* Name */}
          <View
            style={{
              alignItems: "center",
              gap: Spacing.half,
              position: "relative",
            }}
          >
            <ThemedText
              numberOfLines={2}
              style={[
                styles.name,
                {
                  color: rs.title,
                  fontSize: nameSize,
                  lineHeight: Math.round(nameSize * 1.18),
                },
              ]}
            >
              {augment.name}
            </ThemedText>
          </View>

          {/* Description */}
          <ThemedText
            numberOfLines={6}
            style={[
              styles.desc,
              {
                color: rs.desc,
                fontSize: descSize,
                lineHeight: Math.round(descSize * 1.5),
              },
            ]}
          >
            {segments.map((s, i) =>
              s.hl ? (
                <Text
                  key={i}
                  style={{ color: rs.highlight, fontWeight: "700" }}
                >
                  {s.text}
                </Text>
              ) : (
                s.text
              ),
            )}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderCurve: "continuous",
  },
  body: {
    flex: 1,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
    gap: Spacing.two,
  },
  iconArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    marginTop: Spacing.one,
  },
  desc: {
    textAlign: "center",
    paddingHorizontal: Spacing.one,
    flexShrink: 1,
    marginTop: Spacing.half,
  },
});
