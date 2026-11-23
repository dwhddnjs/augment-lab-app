/**
 * 앱스토어 리뷰 요청 — 빌드를 2개째 만든 사용자에게 iOS 기본 별점 다이얼로그를 한 번 띄운다.
 *
 * 저장 직후 빌드 상세에서 부른다(결과를 본 직후가 가장 긍정적인 순간이다). 한 번 요청하면 다시 묻지 않는다.
 * 실제로 뜰지는 iOS 가 정한다 — 1년에 3번까지, TestFlight 에서는 뜨지 않는다. 개발 빌드는 매번 뜨지만 제출되지 않는다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

import { listBuilds } from '@/lib/build-storage';

const REQUESTED_KEY = 'review:requested';
const MIN_BUILDS = 2;

export async function maybeRequestReview(): Promise<void> {
  try {
    if ((await AsyncStorage.getItem(REQUESTED_KEY)) != null) return;
    if ((await listBuilds()).length < MIN_BUILDS) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    await AsyncStorage.setItem(REQUESTED_KEY, '1');
    await StoreReview.requestReview();
  } catch {
    // 리뷰 요청은 부가 기능이다 — 실패해도 사용자에게 알릴 것이 없다.
  }
}
