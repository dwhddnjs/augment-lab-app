/**
 * use-image-prewarm — 첫 설치 시 앱 화면에 실제로 뜨는 아이콘(칼바람 증강 풀, 챔피언,
 * 칼바람 상점 아이템)만 설치 화면 진행률과 함께 받고, 100% 완료돼야만 메인으로 진입한다.
 * 두 번째 부팅부터는 설치 화면 없이, 캐시에서 빠진 것(업데이트로 늘어난 데이터·1주 만료분)만
 * 조용히 채운다. 앱이 포그라운드로 돌아올 때도 채운다 — 만료 삭제가 백그라운드 진입 때 일어난다.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAugments } from '@/features/augments/hooks/use-augments';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { useItemPool } from '@/features/items/hooks/use-items';
import {
  augmentImageUrls,
  championClassIconUrl,
  championSquareUrl,
  itemImageUrl,
} from '@/lib/ddragon';
import { hasPrewarmed, runFirstPrewarm, topUpPrewarm } from '@/lib/image-prewarm';
import { CHAMPION_TAGS } from '@/lib/i18n';

export function useImagePrewarm(): { showSetup: boolean; progress: number } {
  const champions = useChampions();
  const augments = useAugments();
  const aramItems = useItemPool('aram');

  // null = 플래그 확인 중(아주 짧음), false = 스킵, true = 설치 화면 표시.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 칼바람 증강 + 챔피언 사각/역할 아이콘 + 칼바람 상점 아이템 아이콘을 받는다.
    // 항목마다 폴백 주소 목록이고, 첫 주소가 같은 항목(아이콘을 공유하는 증강)은 한 번만
    // 받아 진행률·개수 이중 계산을 막는다.
    // 증강이 맨 앞이다 — 깜빡임이 보이는 드래프트가 첫 소비처라, 조용히 채울 때 먼저 끝나야 한다.
    const chains = [
      // 칼바람 풀에 속한 것만. modes 가 빈 증강(미출시·패치로 삭제·클래식 전용)은 저장된
      // 옛 빌드에서만 보이므로, 첫 설치 진행률을 막을 이유가 없다 — 볼 때 받는다. `_large` 가 없는 아이콘은 화면이
      // base 로 폴백해 그리므로 프리웜도 같은 순서로 받는다. 앱에 넣어 둔 아이콘은 빈 목록이다.
      ...augments.filter((a) => a.modes?.length).map((a) => augmentImageUrls(a.iconPath)),
      ...champions.map((c) => [championSquareUrl(c.imageKey)]),
      ...CHAMPION_TAGS.map((tag) => championClassIconUrl(tag))
        .filter((u): u is string => u != null)
        .map((u) => [u]),
      // 진열 풀만. 전체 목록의 나머지(협곡 하위 아이템·옛 아이템)는 패치로 풀에서 빠진
      // 아이템을 옛 빌드에서 되살릴 때만 쓰여, 첫 설치 시간을 쓸 만큼 자주 뜨지 않는다.
      ...aramItems.map((it) => [itemImageUrl(it.imageKey)]),
    ];
    const allUrls = [...new Map(chains.filter((c) => c.length).map((c) => [c[0], c])).values()];

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') topUpPrewarm(allUrls);
    });

    hasPrewarmed().then((done) => {
      if (cancelled) return;
      if (done) {
        setNeedsSetup(false);
        topUpPrewarm(allUrls);
        return;
      }
      setNeedsSetup(true);
      runFirstPrewarm({
        urls: allUrls,
        onProgress: (p) => {
          if (!cancelled) setProgress(p);
        },
      }).finally(() => {
        if (!cancelled) setProgress(1);
      });
    });

    return () => {
      cancelled = true;
      appState.remove();
    };
    // 부팅 시 1회만 실행한다(로케일 전환 시에도 이미지 URL은 동일 → 재실행 불필요).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 첫 설치이고 core가 다 안 받아졌을 때만 설치 화면을 띄운다.
  const showSetup = needsSetup === true && progress < 1;
  return { showSetup, progress };
}
