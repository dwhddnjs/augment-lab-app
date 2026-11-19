/**
 * image-prewarm — 첫 설치 1회, CDN 아이콘을 디스크 캐시에 미리 적재한다.
 *
 * 실시간 CDN 의존이라 첫 설치엔 수십 초가 걸린다(expo-image prefetch 동시성
 * 한계). 그래서 첫 실행에 한해 "설치 화면"으로 진행률을 보여주며 칼바람 증강 풀,
 * 챔피언, 칼바람 상점 아이템 아이콘을 받아 두고, 100% 완료돼야만 메인으로 보낸다.
 * 이렇게 미리 다 받아 두면 메인 진입 후 CDN 지연으로 아이콘이 깜빡이는 현상이
 * 사라진다. 완료 플래그를 찍어 두 번째 부팅부터는 설치 화면을 건너뛴다. 다만 캐시는
 * 영구가 아니고(1주 만료) 업데이트로 데이터가 늘기도 해서, 그 뒤로는 빠진 것만
 * 조용히 채운다(topUpPrewarm).
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

/**
 * 한 장을 받는다. `chain` 은 폴백 주소 목록이라, 앞 주소가 없으면(404) 다음 주소를 받는다 —
 * 증강은 `_large` 가 없는 아이콘이 있어 화면이 base 로 폴백해 그린다(AugmentImage).
 * PREFETCH_TIMEOUT 을 넘기면 실패로 간주하고 넘어간다. 드래프트 화면의 카드 프리페치도 이걸 쓴다.
 */
export async function prefetchOne(chain: string[]): Promise<void> {
  for (const url of chain) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), PREFETCH_TIMEOUT);
    });
    const result = await Promise.race([
      Image.prefetch(url, { cachePolicy: 'memory-disk' }).catch(() => false),
      timeout,
    ]);
    if (timer) clearTimeout(timer);
    // 받았으면 끝. 시간 초과는 파일이 없는 게 아니라 네트워크 문제라 다음 주소도 소용없다.
    if (result !== false) return;
  }
}

/**
 * URL 목록을 동시성 제한 풀로 받는다. 각 항목 완료(성공·실패·타임아웃 무관)마다
 * onProgress(0~1)를 호출해 진행률을 리포트한다.
 */
async function prefetchPool(urls: string[][], onProgress?: (p: number) => void): Promise<void> {
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
  /**
   * 프리워밍할 아이콘. 항목 하나가 폴백 주소 목록이고(대부분 주소 1개), 중복은 제거된 상태다.
   * 전부 받아야 메인으로 진입한다.
   */
  urls: string[][];
  /** 적재 진행률(0~1). 설치 화면 프로그레스 바에 연결한다. */
  onProgress: (p: number) => void;
}

/**
 * 두 번째 부팅부터 — 디스크 캐시에 없는 아이콘만 조용히 받는다(진행 UI 없음). 두 경우를 메운다:
 * - 앱 업데이트로 데이터(증강 등)가 늘었다. 완료 플래그는 ddragon 버전 단위라 새 아이콘은 첫 설치 때 받지 않았다.
 * - SDWebImage 디스크 캐시는 받은 지 1주가 지나면 앱이 백그라운드로 갈 때 지워진다(maxDiskAge 기본값).
 * 둘 다 받아 두지 않으면 드래프트 카드가 뒤집힌 뒤 아이콘이 네트워크에서 늦게 떠 깜빡인다.
 *
 * ponytail: 1주 만료라 주 1회 아이콘을 다시 받는다. expo-image 가 maxDiskAge 를 노출하지 않아
 * 네이티브(config plugin)로 SDImageCache.shared.config.maxDiskAge = -1 을 걸면 재다운로드가 사라진다.
 */
let toppingUp: Promise<void> | null = null;

export function topUpPrewarm(urls: string[][]): Promise<void> {
  // 포그라운드 복귀가 연달아 와도 한 번만 돈다.
  toppingUp ??= (async () => {
    // 화면(AugmentImage)은 체인 첫 주소(_large)부터 그린다. 뒤 주소만 캐시에 있으면 그리는 순간
    // 첫 주소를 받으러 나가 깜빡이므로 첫 주소로 판정한다 — 16.23 에서 `_large` 가 새로 생긴 아이콘이 그렇다.
    const cached = await Promise.all(
      urls.map((chain) => Image.getCachePathAsync(chain[0]).catch(() => null)),
    );
    await prefetchPool(urls.filter((_, i) => !cached[i]));
  })().finally(() => {
    toppingUp = null;
  });
  return toppingUp;
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
