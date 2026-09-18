/**
 * use-image-prewarm — 첫 설치 시 칼바람·클래식 증강, 챔피언, 아이템 아이콘을
 * 전부 설치 화면 진행률과 함께 받고, 100% 완료돼야만 메인으로 진입한다. 두 번째
 * 부팅부터는 완료 플래그를 보고 설치 과정을 통째로 건너뛴다.
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

export function useImagePrewarm(): { showSetup: boolean; progress: number } {
  const champions = useChampions();
  const augments = useAugments();
  const items = useItems();

  // null = 플래그 확인 중(아주 짧음), false = 스킵, true = 설치 화면 표시.
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 칼바람·클래식 증강 + 챔피언 사각/역할 아이콘 + 전체 아이템(협곡
    // 254 + 클래식 레트로 150) 아이콘을 전부 받는다. 겹치는 아이콘은 Set으로 제거해
    // 진행률·개수 이중 계산을 막는다.
    const allUrls = Array.from(
      new Set([
        ...champions.map((c) => championSquareUrl(c.imageKey)),
        ...CHAMPION_TAGS.map((tag) => championClassIconUrl(tag)).filter(
          (u): u is string => u != null,
        ),
        // 어느 모드 풀에든 속한 것만(칼바람 211 + 클래식 전용 31). modes 가 빈 증강은
        // 미출시·제거라 앱의 어느 화면에도 뜨지 않는데 첫 설치 진행률을 막고 서 있다.
        // 저장된 빌드가 참조하는 증강은 모두 두 풀 중 하나에서 뽑힌 것이라 여기 포함된다.
        ...augments
          .filter((a) => a.modes?.length)
          .map((a) => augmentImageUrl(a.iconPath, 'large')),
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
