/**
 * useBuilds — 저장된 빌드 목록을 반응형으로 구독한다.
 *
 * build-storage의 인메모리 캐시를 useSyncExternalStore로 구독하므로,
 * 어느 화면에서 saveBuild/removeBuild를 호출하든 목록이 즉시 갱신된다.
 * (포커스 시점 재조회에 의존하지 않아 네비게이션 전환 중 경합이 없다.)
 *
 * 반환: 로드 전 null, 이후 최신순 정렬된 전체 빌드 배열.
 */
import { useEffect, useSyncExternalStore } from 'react';

import {
  getBuildsSnapshot,
  listBuilds,
  subscribeBuilds,
  type SavedBuild,
} from '@/lib/build-storage';

// 모듈 레벨 고정 참조 — useSyncExternalStore 재구독 방지(React Compiler 무관).
const subscribe = (onChange: () => void) => subscribeBuilds(onChange);

export function useBuilds(): SavedBuild[] | null {
  const builds = useSyncExternalStore(subscribe, getBuildsSnapshot);

  // 캐시가 비어 있으면(앱 시작 후 최초) 디스크 로드를 트리거한다.
  // 로드 완료 시 store가 emit → 스냅샷이 null→배열로 갱신된다.
  useEffect(() => {
    if (getBuildsSnapshot() == null) {
      listBuilds().catch(() => {});
    }
  }, []);

  return builds;
}
