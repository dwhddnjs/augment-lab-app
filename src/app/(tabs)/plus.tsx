import { useFocusEffect, useRouter } from 'expo-router';

export default function PlusTab() {
  const router = useRouter();
  useFocusEffect(() => {
    router.navigate('/select-champion-modal');
  });
  return null;
}
