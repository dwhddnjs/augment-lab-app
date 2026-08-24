/**
 * ArenaCardOverlay — 카드 3장 선택 오버레이의 껍데기(모루·증강 강화 공용).
 * 어둡게 깔고 가운데에 카드 행을 놓는다. 빈 영역을 누르면 닫힌다.
 *
 * modal: 헤더까지 화면 전체를 덮어야 할 때. 상점 안에서 absolute 로만 깔면
 * 헤더가 가려지지 않아 Modal 이 필요하다(가로 고정이라 orientation 도 가로로 둔다).
 */
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { CARD_ROW_PAD } from "@/components/ui/rarity-card-frame";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  modal?: boolean;
  /** 애니메이션 중이면 닫기를 막는다. */
  locked: boolean;
  gap: number;
  onClose: () => void;
  children: React.ReactNode;
}

export function ArenaCardOverlay({
  modal,
  locked,
  gap,
  onClose,
  children,
}: Props) {
  const { colors } = useTheme();

  const body = (
    <View style={[styles.overlay, { backgroundColor: colors.surface.overlay }]}>
      {/* 빈 영역 탭 → 닫기 */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={locked ? undefined : onClose}
      />
      <View style={[styles.cardsRow, { paddingHorizontal: CARD_ROW_PAD, gap }]}>
        {children}
      </View>
    </View>
  );

  if (!modal) return body;
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      supportedOrientations={["landscape", "landscape-left", "landscape-right"]}
      onRequestClose={locked ? undefined : onClose}
    >
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
