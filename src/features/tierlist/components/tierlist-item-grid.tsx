import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { RemoteImage } from '@/components/ui/remote-image';
import { Radius, Spacing } from '@/constants/theme';
import type { Locale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { cdragonItemIconUrl } from '@/lib/ddragon';
import { useLocalizedData } from '@/lib/i18n';

interface TierItem {
  id: string;
  name: string;
  iconPath: string;
}

/**
 * 아이템 이름·아이콘은 앱 items.ko.json 이 아니라 tierlist-items.{ko,en}.json 에서 온다
 * — 앱 아이템 데이터에 없는 id 가 섞여 있어 CDragon 에서 직접 구웠다.
 */
const itemData: Record<Locale, TierItem[]> = {
  ko: require('@/features/tierlist/data/tierlist-items.ko.json'),
  en: require('@/features/tierlist/data/tierlist-items.en.json'),
};

/** 아이템 격자 아이콘. 402pt 폭에서 한 줄 7개 — 빌드 순서 1줄, 상황템 2줄. */
const ITEM_ICON = 44;

interface Props {
  label: string;
  /** 보여줄 순서대로의 아이템 id. 사전에 없는 id 는 건너뛴다. */
  ids: string[];
}

/**
 * 아이템 아이콘 격자 한 그룹. 카드 행은 6개만으로 세로를 너무 먹어 이름 없이 아이콘만 그린다 —
 * 이름은 VoiceOver 라벨로만 남긴다. 그릴 게 없으면 라벨까지 통째로 숨긴다.
 */
export function TierlistItemGrid({ label, ids }: Props) {
  const { colors } = useTheme();
  const items = useLocalizedData(itemData);
  const byId = new Map(items.map((i) => [i.id, i]));
  const list = ids.flatMap((id) => byId.get(id) ?? []);
  if (!list.length) return null;

  return (
    <View style={styles.group}>
      <ThemedText type="label" color="secondary">
        {label}
      </ThemedText>
      <View style={styles.grid}>
        {list.map((item) => (
          <RemoteImage
            key={item.id}
            uri={cdragonItemIconUrl(item.iconPath)}
            size={ITEM_ICON}
            recyclingKey={item.id}
            // 빌드 상세 아이템 타일(build-item-row)과 같은 1px border.subtle 테두리.
            style={[styles.icon, { borderColor: colors.border.subtle }]}
            accessibilityLabel={item.name}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  icon: {
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
