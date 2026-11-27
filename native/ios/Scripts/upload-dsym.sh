#!/bin/sh
# Release 빌드(아카이브)의 dSYM을 Sentry에 올린다 — 크래시가 심볼과 함께 찍히게 (spec app-shell §7).
# 토큰: SENTRY_AUTH_TOKEN 환경변수(EAS production 환경과 같은 값). 없으면 경고만 내고 빌드는 통과시킨다.
# 끄기: SENTRY_DISABLE_AUTO_UPLOAD=true (RN eas.json preview와 같은 스위치)
set -eu
[ "${CONFIGURATION}" = "Release" ] || exit 0
if [ "${SENTRY_DISABLE_AUTO_UPLOAD:-false}" = "true" ]; then
  echo "Sentry dSYM 업로드 건너뜀 (SENTRY_DISABLE_AUTO_UPLOAD=true)"; exit 0
fi
if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "warning: SENTRY_AUTH_TOKEN 없음 — dSYM 업로드를 건너뛴다(나중에 sentry-cli debug-files upload로 올릴 수 있다)"; exit 0
fi
cli=$(command -v sentry-cli || echo "${SRCROOT}/../../node_modules/.bin/sentry-cli")
if [ ! -x "$cli" ]; then
  echo "warning: sentry-cli를 못 찾음 — npm install(또는 brew install getsentry/tools/sentry-cli) 후 다시"; exit 0
fi
"$cli" debug-files upload --org aram-augment-lab --project augment-lab-app --include-sources "${DWARF_DSYM_FOLDER_PATH}"
