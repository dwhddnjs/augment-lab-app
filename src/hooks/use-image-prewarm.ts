/**
 * use-image-prewarm — 첫 설치 시 칼바람·클래식 증강, 챔피언, 상점 아이템 아이콘을
 * 전부 설치 화면 진행률과 함께 받고, 100% 완료돼야만 메인으로 진입한다. 두 번째
 * 부팅부터는 완료 플래그를 보고 설치 과정을 통째로 건너뛴다.
 */
import { useEffect, useState } from 'react';

import { useAugments } from '@/features/augments/hooks/use-augments';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { useItemPool } from '@/features/items/hooks/use-items';
import {
  augmentImageUrls,
  championClassIconUrl,
  championSquareUrl,
  itemImageUrl,
} from '@/lib/ddragon';
import { hasPrewarmed, runFirstPrewarm } from '@/lib/image-prewarm';
import { CHAMPION_TAGS } from '@/lib/i18n';

export function useImagePrewarm(): { showSetup: boolean; progress: number } {
  const champions = useChampions();
  const augments = useAugments();
  const aramItems = useItemPool('aram');
  const classicItems = useItemPool('classic');

  // null = 플래그 확인 중(아주 짧음), false = 스킵, true = 설치 화면 표시.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 칼바람·클래식 증강 + 챔피언 사각/역할 아이콘 + 두 모드 상점 아이템 아이콘을
    // 전부 받는다. 항목마다 폴백 주소 목록이고, 첫 주소가 같은 항목은 한 번만 받아
    // 진행률·개수 이중 계산을 막는다.
    const chains = [
      ...champions.map((c) => [championSquareUrl(c.imageKey)]),
      ...CHAMPION_TAGS.map((tag) => championClassIconUrl(tag))
        .filter((u): u is string => u != null)
        .map((u) => [u]),
      // 어느 모드 풀에든 속한 것만. modes 가 빈 증강은 미출시·제거라 앱의 어느 화면에도
      // 뜨지 않는데 첫 설치 진행률을 막고 서 있다. `_large` 가 없는 아이콘은 화면이
      // base 로 폴백해 그리므로 프리웜도 같은 순서로 받는다.
      ...augments
        .filter((a) => a.modes?.length)
        .map((a) => augmentImageUrls(a.iconPath)),
      // 진열 풀만. 전체 목록의 나머지(협곡 하위 아이템·옛 아이템)는 패치로 풀에서 빠진
      // 아이템을 옛 빌드에서 되살릴 때만 쓰여, 첫 설치 시간을 쓸 만큼 자주 뜨지 않는다.
      ...[...aramItems, ...classicItems].map((it) => [itemImageUrl(it.imageKey)]),
    ];
    const allUrls = [...new Map(chains.map((c) => [c[0], c])).values()];

    hasPrewarmed().then((done) => {
      if (cancelled) return;
      if (done) {
        setNeedsSetup(false);
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
    };
    // 부팅 시 1회만 실행한다(로케일 전환 시에도 이미지 URL은 동일 → 재실행 불필요).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 첫 설치이고 core가 다 안 받아졌을 때만 설치 화면을 띄운다.
  const showSetup = needsSetup === true && progress < 1;
  return { showSetup, progress };
}
