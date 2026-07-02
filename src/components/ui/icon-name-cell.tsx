/**
 * IconNameCell — 빌드 상세의 공용 아이템 셀. 아이콘 타일 + 이름(2줄).
 * 칼바람 아이템, 아레나 프리즘/전설 아이템이 같은 셀을 공유한다.
 * 폭 고정으로 flexWrap 행에서 이름 줄바꿈이 안정적이다.
 */
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { RemoteImage } from '@/components/ui/remote-image';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  uri: string;
  name: string;
  /** 이미지 캐시 식별자. 미지정 시 uri 사용. */
  recyclingKey?: string;
}

export function IconNameCell({ uri, name, recyclingKey }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.cell}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: colors.surface.raised,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        <RemoteImage
          uri={uri}
          recyclingKey={recyclingKey}
          style={styles.icon}
          contentFit="contain"
        />
      </View>
      <ThemedText
        type="caption"
        color="secondary"
        numberOfLines={2}
        style={styles.name}
      >
        {name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 64,
    alignItems: 'center',
    gap: Spacing.one,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
  },
  name: {
    textAlign: 'center',
  },
});
