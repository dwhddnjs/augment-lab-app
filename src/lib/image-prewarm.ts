/**
 * image-prewarm — 첫 설치 1회, CDN 아이콘을 디스크 캐시에 미리 적재한다.
 *
 * 실시간 CDN 의존이라 첫 설치엔 수십 초가 걸린다(expo-image prefetch 동시성
 * 한계). 그래서 첫 실행에 한해 "설치 화면"으로 진행률을 보여주며 core(챔피언)를
 * 받고, 끝나면 메인으로 보낸 뒤 나머지(증강·아이템)는 백그라운드로 받는다.
 * `Image.prefetch`는 멱등 + memory-disk라 한 번 받으면 재설치 전까지 캐시에
 * 남으므로, 완료 플래그를 찍어 두 번째 부팅부터는 이 과정을 통째로 건너뛴다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

import versionData from '@/lib/version.json';

/** ddragon 버전이 바뀌면(에셋 교체) 다시 prewarm하도록 버전을 키에 포함. */
const doneFlagKey = () => `prewarm:done:${versionData.ddragonVersion}`;

/** 동시에 띄우는 prefetch 수 — 너무 낮으면 느리고, 너무 높으면 일부 타임아웃. */
const CONCURRENCY = 10;

/** 첫 설치 prewarm을 이미 끝냈는지 — true면 설치 화면 없이 바로 메인. */
export async function hasPrewarmed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(doneFlagKey())) != null;
  } catch {
    return false;
  }
}

/**
 * URL 목록을 동시성 제한 풀로 받는다. 각 항목 완료(성공·실패 무관)마다
 * onProgress(0~1)를 호출해 진행률을 리포트한다.
 */
async function prefetchPool(urls: string[], onProgress?: (p: number) => void): Promise<void> {
  if (urls.length === 0) {
    onProgress?.(1);
    return;
  }
  let done = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < urls.length) {
      const i = cursor++;
      await Image.prefetch(urls[i], { cachePolicy: 'memory-disk' }).catch(() => {});
      done += 1;
      onProgress?.(done / urls.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
}

interface FirstPrewarmArgs {
  /** 첫 도달 화면(챔피언 선택) 아이콘 — 설치 화면에서 진행률과 함께 받는다. */
  coreUrls: string[];
  /** 증강·아이템 — core 완료(메인 진입) 후 백그라운드로 받는다. */
  restUrls: string[];
  /** core 적재 진행률(0~1). 설치 화면 프로그레스 바에 연결한다. */
  onCoreProgress: (p: number) => void;
}

/**
 * 첫 설치 1회 실행. core를 진행률과 함께 받아 끝나면(resolve) 메인으로 보낼 수
 * 있게 하고, 완료 플래그를 찍은 뒤 rest를 백그라운드로 이어 받는다.
 */
export async function runFirstPrewarm({
  coreUrls,
  restUrls,
  onCoreProgress,
}: FirstPrewarmArgs): Promise<void> {
  await prefetchPool(coreUrls, onCoreProgress);
  // core 완료 = 첫 화면 보장. 여기서 플래그를 찍어 다음 부팅엔 설치 화면을
  // 다시 띄우지 않는다. rest는 best-effort 백그라운드(못 받은 건 화면별
  // focus prefetch가 백업으로 받는다).
  AsyncStorage.setItem(doneFlagKey(), '1').catch(() => {});
  prefetchPool(restUrls).catch(() => {});
}
