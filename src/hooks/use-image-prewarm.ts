/**
 * use-image-prewarm — 첫 설치 시 챔피언 아이콘(core)을 설치 화면 진행률과 함께
 * 받고, 증강·아이템(rest)은 메인 진입 후 백그라운드로 받는다. 두 번째 부팅부터는
 * 완료 플래그를 보고 설치 과정을 통째로 건너뛴다.
 */
import { useEffect, useState } from 'react';

import { useAugments } from '@/features/augments/hooks/use-augments';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { useItems } from '@/features/items/hooks/use-items';
import {
  augmentImageUrl,
  championClassIconUrl,
  championSquareUrl,
  itemImageUrl,
} from '@/lib/ddragon';
import { hasPrewarmed, runFirstPrewarm } from '@/lib/image-prewarm';
import { CHAMPION_TAGS } from '@/lib/i18n';

const ARAM_IDS = new Set<string>(require('@/features/items/data/aram-item-ids.json'));

export function useImagePrewarm(): { showSetup: boolean; progress: number } {
  const champions = useChampions();
  const augments = useAugments();
  const items = useItems();

  // null = 플래그 확인 중(아주 짧음), false = 스킵, true = 설치 화면 표시.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const coreUrls = [
      ...champions.map((c) => championSquareUrl(c.imageKey)),
      ...CHAMPION_TAGS.map((tag) => championClassIconUrl(tag)).filter(
        (u): u is string => u != null,
      ),
    ];
    const restUrls = [
      ...augments.map((a) => augmentImageUrl(a.iconPath, 'large')),
      ...items.filter((it) => ARAM_IDS.has(it.id)).map((it) => itemImageUrl(it.imageKey)),
    ];

    hasPrewarmed().then((done) => {
      if (cancelled) return;
      if (done) {
        setNeedsSetup(false);
        return;
      }
      setNeedsSetup(true);
      runFirstPrewarm({
        coreUrls,
        restUrls,
        onCoreProgress: (p) => {
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
