// Sentry: 번들에 디버그 ID를 심어 크래시 스택을 원본 소스 줄로 되돌린다(getDefaultConfig 대체).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
