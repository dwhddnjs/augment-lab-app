/**
 * use-image-prewarm — 첫 설치 시 아레나·칼바람 증강, 챔피언, 아이템 아이콘을
 * 전부 설치 화면 진행률과 함께 받고, 100% 완료돼야만 메인으로 진입한다. 두 번째
 * 부팅부터는 완료 플래그를 보고 설치 과정을 통째로 건너뛴다.
 */
import { useEffect, useState } from 'react';

import { useArenaAugments } from '@/features/arena/hooks/use-arena-augments';
import { usePrismaticItems, useSpecialAugments } from '@/features/arena/hooks/use-arena-items';
import { useAugments } from '@/features/augments/hooks/use-augments';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { useItems } from '@/features/items/hooks/use-items';
import {
  augmentImageUrl,
  cdragonItemIconUrl,
  championClassIconUrl,
  championSquareUrl,
  itemImageUrl,
} from '@/lib/ddragon';
import { hasPrewarmed, runFirstPrewarm } from '@/lib/image-prewarm';
import { CHAMPION_TAGS } from '@/lib/i18n';

export function useImagePrewarm(): { showSetup: boolean; progress: number } {
  const champions = useChampions();
  const augments = useAugments();
  const arenaAugments = useArenaAugments();
  const specialAugments = useSpecialAugments();
  const prismaticItems = usePrismaticItems();
  const items = useItems();

  // null = 플래그 확인 중(아주 짧음), false = 스킵, true = 설치 화면 표시.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 아레나·칼바람 증강 + 챔피언 사각/역할 아이콘 + 프리즘·전체 아이템 아이콘을
    // 전부 받는다. 겹치는 아이콘은 Set으로 제거해 진행률·개수 이중 계산을 막는다.
    const allUrls = Array.from(
      new Set([
        ...champions.map((c) => championSquareUrl(c.imageKey)),
        ...CHAMPION_TAGS.map((tag) => championClassIconUrl(tag)).filter(
          (u): u is string => u != null,
        ),
        ...augments.map((a) => augmentImageUrl(a.iconPath, 'large')),
        ...arenaAugments.map((a) => augmentImageUrl(a.iconPath, 'large')),
        // 재련(special) 아이콘은 CDragon에 _large 자산이 없어(404) AugmentImage가
        // base(컬러 원본)→small로 폴백한다. large만 프리웜하면 404라 캐시에 남지 않아
        // 첫 진입 때 네트워크로 받게 되므로, 실제로 뜨는 base·small을 받아둔다.
        ...specialAugments.flatMap((a) => [
          augmentImageUrl(a.iconPath, 'base'),
          augmentImageUrl(a.iconPath, 'small'),
        ]),
        ...prismaticItems.map((p) => cdragonItemIconUrl(p.iconPath)),
        ...items.map((it) => itemImageUrl(it.imageKey)),
      ]),
    );

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
