import { HomeScreen } from '@/features/builds/screens/home-screen';
import { TopTierSection } from '@/features/tierlist/components/top-tier-section';

// 홈은 빌드 화면이 그리고, S티어 줄은 티어리스트가 그린다 — 두 화면 도메인은 여기서만 만난다.
export default function HomeRoute() {
  return <HomeScreen footer={<TopTierSection />} />;
}
