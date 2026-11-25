# Android (Kotlin + Jetpack Compose) 작업 표

**iOS W3(I-44)까지 끝난 뒤 시작한다.** 작업 파일(`android/A-xx-*.md`)은 A-00에서 만든다.
- 템플릿·규칙은 iOS와 같다.
- iOS에서 나온 승격 후보·진행 기록의 교훈을 반영해 범위를 다시 다듬는다.
- 동작 명세는 `spec/`를 그대로 쓴다.
- Swift 구현은 참고만 한다. 정답지는 spec과 RN 원본이다.

## 확정 사항

**ID·버전**
- `applicationId = "com.porcana"` — Play 리스팅을 이어받으므로 **영구 고정**. 바꾸면 새 앱이 된다.
- `namespace = "com.augmentlab"` — 코드 패키지 이름. applicationId와 따로 둔다.
- minSdk 26, targetSdk 36(2026-08-31부터 Play 필수), compileSdk 36
- versionCode는 porcana의 현재 값보다 커야 한다(`porcana-to-augmentlab.md` §0). versionName 2.0.0

**구성**
- 모듈 1개 `:app`
  - 순수 로직: `com.augmentlab.core.*` — JVM 단위 테스트(`./gradlew test`), 에뮬레이터 불필요
  - UI: `com.augmentlab.ui.*`, `com.augmentlab.feature.*`
- 의존성(A-00에서만 추가): Compose BOM + Material3(기반 컴포넌트만), Navigation Compose(type-safe), kotlinx.serialization, Coil 3, PostHog Android, Sentry Android, Play In-App Review
- 저장: SharedPreferences(작은 값), 앱 파일(`builds:v1`) — 키 이름은 iOS·RN과 같다(백업 호환)
- 데이터 JSON: `sourceSets.main.assets.srcDirs`로 `src/features/*/data`와 `src/lib/version.json`을 연결한다(복사하지 않음)
- 아이콘: RN의 `MaterialCommunityIcons.ttf`·`MaterialIcons.ttf`와 glyphmap. SF Symbol 자리는 A-00 매핑표의 Material 아이콘으로.

**디자인**
- iOS 26 미만 폴백 디자인을 기준으로 한다: glass 대신 단색/블러(API 31+ `RenderEffect`, 미만은 단색), CustomTabBar
- 폰트는 시스템(Roboto)

**Android 전용 정책** (A-00 매핑 문서에 확정)
- 시스템 뒤로가기
  - 드래프트: 종료 확인
  - 시트·모달: 닫기
  - 탭 루트: 앱 종료
- edge-to-edge, 가로 화면에서 시스템 바 처리
- 회전: Activity `requestedOrientation`(기본 세로, 드래프트만 가로)
- 백업: 내보내기는 `ACTION_CREATE_DOCUMENT` 또는 공유 인텐트, 가져오기는 `ACTION_OPEN_DOCUMENT`
- 햅틱: `HapticFeedbackConstants` / `VibrationEffect`

## 작업 표 (iOS와 같은 경계 — 경로는 `native/android/app/src/main/java/com/augmentlab/` 기준)

| ID | 작업 | 대응 iOS | 비고 |
|---|---|---|---|
| A-00 | 프로젝트 골격 + Android 작업 파일 생성 + `spec/android-mapping.md`(아이콘·glass·시트·뒤로가기·edge-to-edge) | I-00 | Gradle·의존성·에셋·폰트·assets 연결·서명 설정 틀(`keystore.properties`, gitignore) |
| A-01 | 디자인 토큰·텍스트·아이콘 | I-01 | |
| A-02a~d | 데이터 모델 / 텍스트 / 아이템 계산 / 티어 계산 | I-02a~d | `core` 패키지, JVM 테스트 |
| A-03 | 설정·번역 | I-03 | |
| A-04a·b | 빌드 저장소 / 백업 형식 | I-04a·b | AsyncStorage 이관(I-04c)에 해당하는 작업은 없음 |
| A-05 | 이미지·프리웜 (Coil 디스크 캐시) | I-05 | |
| A-06a~c | 셸·탭·라우터·스텁 / 드래프트 표시·회전 / 부팅 연출 | I-06a~c | 뒤로가기 정책 포함 |
| A-07 | 분석·크래시 | I-07 | 화면 이름은 iOS와 같은 문자열 |
| A-10~15 | 공용 UI | I-10~15 | glass → 폴백 디자인 |
| A-20~33 | 피처 | I-20~33 | 같은 분할(칼바람 5개, 커스텀 4개, 티어리스트 2개) |
| A-40~42 | 드래프트 흐름 통합 / 동일성 검수 / 업데이트 설치 리허설(porcana 설치본 위에 덮어 설치) | I-40~42 | 직렬 |
| A-43 | Android 출시 준비: 서명(업로드 키), versionCode, R8/매핑 업로드, Data safety 초안 | I-43 | 직렬 |
| A-44 | 데이터 파이프라인·문서 | I-44 | 직렬 |
| A-45 | porcana 잔여 데이터 정리: 첫 실행 1회, RN `RKStorage` DB·Expo 파일·로그인 토큰 삭제 | – | 이관 아님(삭제) |
| A-46 | Play 출시 | – | `porcana-to-augmentlab.md` 절차 |
| R-01 | RN 제거·JSON을 `data/`로 이동·스크립트·스킬·CLAUDE.md 갱신 | – | 맨 마지막, 직렬 |
