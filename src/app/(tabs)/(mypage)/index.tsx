import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { hint: '마이페이지 준비 중이에요' },
  en: { hint: 'My Page is coming soon' },
};

export default function MyPageScreen() {
  const translate = useTranslation(t);
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.placeholder}>
          <ThemedText type="body" color="tertiary">
            {translate('hint')}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  placeholder: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
