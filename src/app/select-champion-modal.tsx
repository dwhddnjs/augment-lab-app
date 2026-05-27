import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useChampions } from '@/hooks/use-champions';
import { useTheme } from '@/hooks/use-theme';
import { championSquareUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { title: '챔피언을 선택해주세요', start: '시작하기' },
  en: { title: 'Select a Champion', start: 'Start' },
};

export default function SelectChampionModal() {
  const champions = useChampions();
  const theme = useTheme();
  const translate = useTranslation(t);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId((curr) => (curr === id ? null : id));
  };

  const handleStart = () => {
    router.navigate('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          {translate('title')}
        </ThemedText>

        <FlatList
          data={champions}
          numColumns={4}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const isSelected = selectedId === item.id;
            return (
              <Pressable onPress={() => handleSelect(item.id)} style={styles.cell}>
                <Image
                  source={{ uri: championSquareUrl(item.imageKey) }}
                  style={[styles.image, isSelected && { borderColor: theme.accent, borderWidth: 3 }]}
                  contentFit="cover"
                />
                <ThemedText type="small" numberOfLines={1} style={styles.name}>
                  {item.name}
                </ThemedText>
              </Pressable>
            );
          }}
        />

        <Pressable
          onPress={handleStart}
          disabled={!selectedId}
          style={[
            styles.startButton,
            { backgroundColor: theme.accent, opacity: selectedId ? 1 : 0.4 },
          ]}>
          <ThemedText style={[styles.startText, { color: '#ffffff' }]}>
            {translate('start')}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  grid: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.one,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  name: {
    textAlign: 'center',
  },
  startButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  startText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
