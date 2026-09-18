import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { RemoteImage } from '@/components/ui/remote-image';
import { Radius, Spacing } from '@/constants/theme';
import { pct, spellIcons } from '@/features/tierlist/tiers';
import { useTheme } from '@/hooks/use-theme';
import { cdragonIconUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { label: '추천 스펠, 픽률 {pick}' },
  en: { label: 'Recommended spells, pick rate {pick}' },
};

/** 스펠 아이콘. heading 한 줄 높이 안에 들어간다. */
const SPELL_ICON = 24;

interface Props {
  spells: number[];
  /** 위 조합의 픽률(0~1) — 태그 빌드 전체 판수 대비. */
  pick: number;
}

/**
 * 최다 스펠 조합 + 픽률. 아이템 heading 오른쪽 끝에 붙어 세로 한 줄을 아낀다.
 * 스펠 이름은 굽지 않아서 VoiceOver 는 묶음 하나로 "추천 스펠, 픽률 79.5%" 만 읽는다.
 */
export function TierlistSpellPill({ spells, pick }: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  // fetch 스크립트가 아이콘 없는 조합을 [] 로 비우지만, 생성물이 어긋나도 크래시 대신 숨긴다.
  const paths = spells.map((id) => spellIcons[id]);
  if (!paths.length || paths.some((p) => !p)) return null;

  // 헤더의 승률·픽률과 같은 소수 1자리.
  const pickText = pct(pick);
  return (
    <View
      accessible
      accessibilityLabel={translate('label').replace('{pick}', pickText)}
      style={[styles.pill, { backgroundColor: colors.surface.raised }]}
    >
      {paths.map((path, i) => (
        <RemoteImage
          key={spells[i]}
          // 스펠 iconPath 도 아이템과 같은 CDragon 경로 규칙이다.
          uri={cdragonIconUrl(path)}
          size={SPELL_ICON}
          style={[styles.icon, { borderColor: colors.border.subtle }]}
        />
      ))}
      <ThemedText type="label" color="accent">
        {pickText}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.one,
    paddingRight: Spacing.two,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
  },
  icon: {
    // 아이템 격자와 같은 1px border.subtle 테두리.
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
