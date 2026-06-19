import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * 원격(DDragon/CDragon CDN) 이미지 공용 로더.
 * 첫 설치 시 캐시가 비어 검은 박스가 깜빡이던 문제를 잡기 위해 기본값을 일괄 적용한다:
 * - `cachePolicy="memory-disk"` 로 디스크 캐시까지 사용 → 재방문 시 즉시 표시
 * - 로딩 중에는 검정 대신 `surface.raised` 톤 박스를 깔고, `transition` fade-in 으로 부드럽게 전환
 * - `recyclingKey` 로 리스트 재활용 시 잘못된 이미지 잔상 방지
 *
 * 증강 아이콘처럼 다단 폴백이 필요한 경우는 `AugmentImage` 를 쓴다.
 */
interface Props {
  uri: string;
  /** 정사각 변. style 로 직접 width/height 를 줄 거면 생략 가능. */
  size?: number;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** 리스트 재활용 식별자. 미지정 시 uri 사용. */
  recyclingKey?: string;
  /** fade-in 지속(ms). 기본 200. */
  transition?: number;
}

export function RemoteImage({
  uri,
  size,
  style,
  contentFit = 'cover',
  recyclingKey,
  transition = 200,
}: Props) {
  const { colors } = useTheme();

  return (
    <Image
      source={{ uri }}
      style={[
        size != null ? { width: size, height: size } : null,
        { backgroundColor: colors.surface.raised },
        style,
      ]}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={transition}
      recyclingKey={recyclingKey ?? uri}
    />
  );
}
