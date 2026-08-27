/**
 * DragCell — 좌측 리스트의 셀을 우측 패널로 끌어 담는 제스처 래퍼.
 *
 * 증강 카드와 아이템 아이콘이 같은 조작을 공유한다. 셋 중 하나라도 빠지면 깨진다:
 *   - activateAfterLongPress: 짧은 스와이프는 리스트 스크롤이라 롱프레스로 갈라낸다.
 *   - blocksExternalGesture: 드래그가 활성된 뒤 리스트가 같이 흐르는 걸 막는다.
 *     (simultaneousWithExternalGesture 는 정반대 의미라 쓰면 안 된다.)
 *   - onTouchesCancelled: 손가락을 시스템에 뺏겨도 고스트가 화면에 남지 않게 한다.
 *
 * 고스트 좌표는 worklet 이 shared value 에 직접 쓴다(UI 스레드). JS 로는 시작·끝만
 * 알린다 — 매 프레임 scheduleOnRN 하면 JS 스레드를 태워 프레임이 튄다.
 */
import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import {
  Gesture,
  GestureDetector,
  type GestureType,
} from "react-native-gesture-handler";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { Augment } from "@/features/augments/types";
import type { Item } from "@/features/items/types";

/** 드래그 중인 것. 화면이 이걸로 고스트 모양과 담을 곳을 고른다. */
export type DragPayload =
  | { kind: "augment"; augment: Augment }
  | { kind: "item"; item: Item };

/** 롱프레스 후 드래그 활성 — 짧으면 스크롤이 드래그로 오인되고, 길면 굼뜨다. */
const LONG_PRESS_MS = 180;

interface Props {
  payload: DragPayload;
  /** 퀵모드에선 탭으로 담으므로 드래그를 끈다. */
  enabled: boolean;
  /** 셀이 막아야 할 리스트 스크롤 제스처. */
  listGesture: GestureType;
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  style?: ViewStyle;
  onDragStart: (payload: DragPayload) => void;
  /** absoluteX 가 음수면 취소(시스템이 손가락을 가져감). */
  onDragEnd: (payload: DragPayload, absoluteX: number) => void;
  children: ReactNode;
}

export function DragCell({
  payload,
  enabled,
  listGesture,
  ghostX,
  ghostY,
  style,
  onDragStart,
  onDragEnd,
  children,
}: Props) {
  // 이 셀이 실제로 드래그를 시작했는지. onTouchesCancelled 는 롱프레스로 활성되기
  // 전의 스침에도 발화하므로, 이 플래그가 없으면 옆 셀을 살짝 건드린 것만으로도
  // 진행 중인 다른 셀의 드래그가 끝난 것으로 화면에 알려져 고스트가 사라진다.
  const dragging = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activateAfterLongPress(LONG_PRESS_MS)
    .blocksExternalGesture(listGesture)
    .onStart((e) => {
      "worklet";
      dragging.set(true);
      ghostX.set(e.absoluteX);
      ghostY.set(e.absoluteY);
      scheduleOnRN(onDragStart, payload);
    })
    .onUpdate((e) => {
      "worklet";
      ghostX.set(e.absoluteX);
      ghostY.set(e.absoluteY);
    })
    .onEnd((e) => {
      "worklet";
      dragging.set(false);
      scheduleOnRN(onDragEnd, payload, e.absoluteX);
    })
    .onTouchesCancelled(() => {
      "worklet";
      if (!dragging.get()) return;
      dragging.set(false);
      scheduleOnRN(onDragEnd, payload, -1);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={style}>{children}</View>
    </GestureDetector>
  );
}
