/**
 * DetailCardRow — 빌드 상세의 공용 카드 행.
 * 좌측 강조 테두리 + 아이콘 슬롯 + 이름(+메타) + 설명. 칼바람 증강/아이템,
 * 아레나 증강/재련이 모두 같은 레이아웃을 공유하도록 한다.
 *
 * 도메인 무관 프리미티브 — 아이콘 노드/색/문자열만 받는다.
 */
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** 좌측 강조 테두리 색(희귀도 tint 등). */
  accentColor: string;
  /** 좌측 아이콘 슬롯(타일 등). */
  icon: React.ReactNode;
  title: string;
  /** 제목 우측 메타(예: 강화 레벨 별). */
  meta?: React.ReactNode;
  description?: string;
}

export function DetailCardRow({
  accentColor,
  icon,
  title,
  meta,
  description,
}: Props) {
  const { colors } = useTheme();
  return (
    <ThemedView
      surface="raised"
      style={[
        styles.row,
        { borderColor: colors.border.subtle, borderLeftColor: accentColor },
      ]}
    >
      {icon}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="label" style={styles.title}>
            {title}
          </ThemedText>
          {meta}
        </View>
        {description ? (
          <ThemedText type="caption" color="secondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    fontWeight: '700',
    flexShrink: 1,
  },
});
