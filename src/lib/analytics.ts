/**
 * 사용자 지표(PostHog)와 크래시 리포트(Sentry).
 * PostHog = 어떤 화면에 머물고 어디서 나가는지(화면 이동·체류·세션 리플레이),
 * Sentry = 어디서 크래시·에러가 나는지. 역할을 나눠 PostHog 에러 수집은 켜지 않는다.
 *
 * 두 키 모두 앱 번들에 들어가도 되는 공개용 값이다. 비어 있거나 개발 빌드(__DEV__)면 꺼진다 —
 * 개발 중 내 사용 기록이 실제 지표에 섞이지 않게.
 */
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import { AppState } from 'react-native';

// PostHog → Settings → Project → Project API key (phc_…). 가입 리전이 EU면 host를 eu.i.posthog.com 으로.
const POSTHOG_KEY = 'phc_zZqj3uAVvnDFr5nHXAWQT4zbv2E9iV24oguBxBhdeDXC';
const POSTHOG_HOST = 'https://us.i.posthog.com';
// Sentry → Project Settings → Client Keys (DSN)
const SENTRY_DSN =
  'https://95f5d2e79f0d3ceb7c4e5e9753c5b866@o4512466062082048.ingest.us.sentry.io/4512466068242433';

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !__DEV__ && !!SENTRY_DSN,
  // 에러 순간의 화면 캡처 — 어떤 UI 상태에서 터졌는지 바로 보인다.
  attachScreenshot: true,
});

// 빈 키를 넘기면 생성자가 throw 하므로 아예 만들지 않는다.
const posthog =
  POSTHOG_KEY && !__DEV__
    ? new PostHog(POSTHOG_KEY, {
        host: POSTHOG_HOST,
        enableSessionReplay: true,
        // 화면에 개인정보가 없다(챔피언·증강·아이템뿐). 기본값(전부 가림)이면 리플레이가 빈 상자만 보인다.
        sessionReplayConfig: { maskAllTextInputs: false, maskAllImages: false },
      })
    : undefined;

let current: { name: string; at: number } | undefined;

/** 지금 화면에 머문 시간을 보낸다. PostHog 모바일엔 화면 체류시간 지표가 없어 직접 잰다. */
function leaveScreen() {
  if (!current) return;
  posthog?.capture('screen_left', {
    screen: current.name,
    duration_s: Math.round((Date.now() - current.at) / 1000),
  });
}

/** 화면 전환 기록 — 화면별 체류·이탈 분석과, 크래시가 어느 화면에서 났는지에 쓴다. */
export function trackScreen(name: string) {
  leaveScreen();
  current = { name, at: Date.now() };
  posthog?.screen(name);
  Sentry.setTag('screen', name);
  Sentry.addBreadcrumb({ category: 'navigation', message: name });
}

// 백그라운드에 있던 시간은 체류시간에서 뺀다 — 나갈 때 한 번 보내고, 돌아오면 다시 잰다.
AppState.addEventListener('change', (state) => {
  if (!current) return;
  if (state === 'background') leaveScreen();
  else if (state === 'active') current.at = Date.now();
});
