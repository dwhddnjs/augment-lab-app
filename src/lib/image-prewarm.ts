/**
 * image-prewarm — 첫 설치 1회, CDN 아이콘을 디스크 캐시에 미리 적재한다.
 *
 * 실시간 CDN 의존이라 첫 설치엔 수십 초가 걸린다(expo-image prefetch 동시성
 * 한계). 그래서 첫 실행에 한해 "설치 화면"으로 진행률을 보여주며 아레나·칼바람
 * 증강, 챔피언, 아이템 아이콘을 전부 받아 두고, 100% 완료돼야만 메인으로 보낸다.
 * 이렇게 미리 다 받아 두면 메인 진입 후 CDN 지연으로 아이콘이 깜빡이는 현상이
 * 사라진다. `Image.prefetch`는 멱등 + memory-disk라 한 번 받으면 재설치 전까지
 * 캐시에 남으므로, 완료 플래그를 찍어 두 번째 부팅부터는 이 과정을 통째로 건너뛴다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

import versionData from '@/lib/version.json';

/** ddragon 버전이 바뀌면(에셋 교체) 다시 prewarm하도록 버전을 키에 포함. */
const doneFlagKey = () => `prewarm:done:${versionData.ddragonVersion}`;

/** 동시에 띄우는 prefetch 수 — 너무 낮으면 느리고, 너무 높으면 일부 타임아웃. */
const CONCURRENCY = 12;

/** 한 장이 응답 없이 매달려 전체 진행률을 멈추지 않도록 개별 prefetch 상한(ms). */
const PREFETCH_TIMEOUT = 15000;

/** 첫 설치 prewarm을 이미 끝냈는지 — true면 설치 화면 없이 바로 메인. */
export async function hasPrewarmed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(doneFlagKey())) != null;
  } catch {
    return false;
  }
}

/** 한 장을 받되 PREFETCH_TIMEOUT을 넘기면 실패로 간주하고 넘어간다. */
async function prefetchOne(url: string): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, PREFETCH_TIMEOUT);
  });
  await Promise.race([
    Image.prefetch(url, { cachePolicy: 'memory-disk' }).then(() => {}),
    timeout,
  ]).catch(() => {});
  if (timer) clearTimeout(timer);
}

/**
 * URL 목록을 동시성 제한 풀로 받는다. 각 항목 완료(성공·실패·타임아웃 무관)마다
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
      await prefetchOne(urls[i]);
      done += 1;
      onProgress?.(done / urls.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
}

interface FirstPrewarmArgs {
  /** 프리워밍할 전체 아이콘 URL(중복 제거된 상태). 전부 받아야 메인으로 진입한다. */
  urls: string[];
  /** 적재 진행률(0~1). 설치 화면 프로그레스 바에 연결한다. */
  onProgress: (p: number) => void;
}

/**
 * 첫 설치 1회 실행. 전체 아이콘을 진행률과 함께 받고, 다 받으면 완료 플래그를
 * 찍는다(다음 부팅엔 설치 화면 스킵). 실패·타임아웃한 장은 진행률에 카운트되어
 * 넘어가므로 오프라인이어도 결국 100%에 도달해 앱이 잠기지 않는다(못 받은 건
 * 화면별 focus prefetch가 백업으로 받는다).
 */
export async function runFirstPrewarm({ urls, onProgress }: FirstPrewarmArgs): Promise<void> {
  await prefetchPool(urls, onProgress);
  AsyncStorage.setItem(doneFlagKey(), '1').catch(() => {});
}
