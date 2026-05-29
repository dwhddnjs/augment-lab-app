import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

export default function PlusTab() {
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      router.navigate('/select-champion-modal');
    }, [router])
  );
  return null;
}
