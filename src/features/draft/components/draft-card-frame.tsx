import { StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Augment, AugmentRarity } from "@/features/augments/types";
import { cleanAugmentDescription } from "@/lib/augment-text";
import { AugmentIcon } from "./augment-icon";

// Fallback SF Symbols when an augment has no icon path.
const RARITY_SF: Record<AugmentRarity, string> = {
  silver: "sf:shield.fill",
  gold: "sf:star.fill",
  prismatic: "sf:sparkles",
};

interface RarityStyle {
  tone: "dark" | "light";
  // Outer metallic rim — diagonal brushed-metal sheen.
  frameImage: string;
  outerGlow: string;
  // Thin inner ornament line + subtle corner brackets.
  innerLine: string;
  corner: string;
  // Body
  bodyColor: string;
  bodyImage: string;
  // Emblem
  iconTint: string;
  haloImage: string;
  // Text
  title: string;
  desc: string;
  highlight: string;
  // Pill
  pillBg: string;
  pillBorder: string;
  pillText: string;
}

// Each rarity is an intrinsic in-game palette (like the existing AugmentRarityColors),
// so the metallic/holographic hexes live here rather than in the app theme tokens.
const RARITY: Record<AugmentRarity, RarityStyle> = {
  silver: {
    tone: "dark",
    frameImage:
      "linear-gradient(135deg, #34383f 0%, #5b616a 15%, #818892 31%, #3f444c 50%, #6b7079 66%, #383c43 82%, #5e646d 100%)",
    outerGlow: "0 6px 22px rgba(0,0,0,0.6), 0 0 12px rgba(120,128,140,0.18)",
    innerLine: "rgba(220,226,234,0.16)",
    corner: "rgba(228,233,240,0.5)",
    bodyColor: "#0A0B0D",
    bodyImage:
      "radial-gradient(ellipse 80% 54% at 50% 22%, rgba(150,158,170,0.22) 0%, transparent 62%), linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 28%, rgba(0,0,0,0.5) 100%)",
    iconTint: "#E4E9F0",
    haloImage:
      "radial-gradient(circle, rgba(196,204,216,0.5) 0%, rgba(196,204,216,0.12) 45%, transparent 72%)",
    title: "#F4F6F9",
    desc: "#AEB4BD",
    highlight: "#E6EAF0",
    pillBg: "rgba(255,255,255,0.06)",
    pillBorder: "rgba(228,233,240,0.24)",
    pillText: "#C7CCD4",
  },
  gold: {
    tone: "dark",
    frameImage:
      "linear-gradient(135deg, #5c481c 0%, #c9a64e 16%, #f7e9b8 30%, #98782e 48%, #e7c477 64%, #6a4f1f 82%, #d4ad44 100%)",
    outerGlow: "0 6px 22px rgba(0,0,0,0.55), 0 0 16px rgba(232,179,57,0.32)",
    innerLine: "rgba(240,214,140,0.20)",
    corner: "rgba(246,232,178,0.55)",
    bodyColor: "#0B0A07",
    bodyImage:
      "radial-gradient(ellipse 80% 54% at 50% 22%, rgba(232,179,57,0.22) 0%, transparent 62%), linear-gradient(to bottom, rgba(247,233,184,0.06) 0%, transparent 28%, rgba(0,0,0,0.52) 100%)",
    iconTint: "#F2D98F",
    haloImage:
      "radial-gradient(circle, rgba(232,179,57,0.55) 0%, rgba(232,179,57,0.14) 45%, transparent 72%)",
    title: "#F4F6F9",
    desc: "#AEB4BD",
    highlight: "#F2C766",
    pillBg: "rgba(255,235,180,0.08)",
    pillBorder: "rgba(240,214,140,0.32)",
    pillText: "#E6D6A6",
  },
  prismatic: {
    tone: "light",
    frameImage:
      "linear-gradient(135deg, #ffc2e6 0%, #d9b8ff 19%, #ffffff 35%, #aee4ff 52%, #bafcd9 69%, #ffe0c4 85%, #f3c2ff 100%)",
    outerGlow: "0 6px 24px rgba(0,0,0,0.5), 0 0 18px rgba(198,161,255,0.45)",
    innerLine: "rgba(150,120,200,0.22)",
    corner: "rgba(140,110,190,0.42)",
    bodyColor: "#0B0A07",
    bodyImage:
      "radial-gradient(circle at 22% 16%, rgba(255,190,230,0.6) 0%, transparent 46%), radial-gradient(circle at 82% 22%, rgba(170,225,255,0.55) 0%, transparent 46%), radial-gradient(circle at 28% 90%, rgba(190,250,220,0.55) 0%, transparent 50%), radial-gradient(circle at 88% 86%, rgba(218,184,255,0.5) 0%, transparent 50%), radial-gradient(circle at 55% 48%, rgba(255,255,255,0.6) 0%, transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 70%)",
    iconTint: "#f3c2ff",

    haloImage:
      "radial-gradient(circle, rgba(186,146,255,0.42) 0%, rgba(146,206,255,0.18) 48%, transparent 74%)",
    title: "#F4F6F9",
    desc: "#AEB4BD",
    highlight: "#7A4FC0",
    pillBg: "rgba(255,255,255,0.6)",
    pillBorder: "rgba(120,90,170,0.3)",
    pillText: "#4A3F66",
  },
};

const t = {
  ko: { silver: "실버", gold: "골드", prismatic: "프리즘" },
  en: { silver: "Silver", gold: "Gold", prismatic: "Prismatic" },
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

export function DraftCardFrame({ augment, cardWidth }: Props) {
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
      <View
        style={[
          styles.body,
          {
            backgroundColor: rs.bodyColor,
            // experimental_backgroundImage: rs.bodyImage,
            // borderColor: rs.innerLine,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Emblem with soft halo */}
          <View style={[styles.iconArea, { marginBottom: Spacing.one }]}>
            <AugmentIcon
              iconPath={augment.iconPath}
              size={iconSize}
              tint={rs.iconTint}
              fallbackSymbol={RARITY_SF[augment.rarity]}
              recyclingKey={augment.id}
            />
          </View>
          {/* Name */}
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
    // marginTop: Spacing.two,
  },
  halo: {
    position: "absolute",
  },
  name: {
    textAlign: "center",
    fontWeight: "700",
    marginTop: Spacing.one,
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: {
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  desc: {
    textAlign: "center",
    paddingHorizontal: Spacing.one,
    flexShrink: 1,
    marginTop: Spacing.half,
  },
});
