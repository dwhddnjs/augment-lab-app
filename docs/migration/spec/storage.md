# 저장·백업·이관 명세

RN 원본: `src/lib/build-storage.ts`, `src/lib/backup.ts`, `src/lib/backup-format.ts`, `src/lib/review.ts`, `src/lib/image-prewarm.ts`, `src/hooks/use-locale.ts`, `src/hooks/use-theme-preference.ts`, `node_modules/@react-native-async-storage/async-storage/ios/RNCAsyncStorage.mm`.

## 1. 저장 키 (전체 목록)

| 키 | 값 (따옴표 없는 평문) | 없을 때 | 백업 대상 |
|---|---|---|---|
| `builds:v1` | `SavedBuild[]` JSON, 최신순 | `[]` | O |
| `theme:v1` | `system` / `light` / `dark` | `system` (그 외 값도 system) | O |
| `locale:v1` | `ko` / `en` | **네이티브: 기기 언어**(ko면 ko, 아니면 en). RN은 항상 ko — 의도적 변경 | O |
| `review:requested` | `'1'` | 없음 | X |
| `prewarm:done:<ddragonVersion>` | `'1'` | 없음 (읽기 오류도 없음으로 처리) | X |

- 옛 `prewarm:done:16.11.1` 같은 키는 무시한다.
- 네이티브 저장소: 키 이름을 그대로 쓴다(백업 형식과 맞추기 위해).
  - 작은 값 → iOS `UserDefaults`, Android `SharedPreferences`
  - `builds:v1` → 앱 지원 폴더의 파일(원자적 쓰기)

## 2. SavedBuild

```
{ id: string, mode: 'aram', championId: string, augmentIds: string[], transmutedIds?: string[],
  itemIds: string[] (0–6), headliner?: {id: string, skills: ('q'|'w'|'e'|'r')[], stickers: string[]},
  custom?: true, createdAt: ISO-8601 }
```

- **id**: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}` (예: `mf3k2x1a-4h7k2p`)
- **createdAt**: `toISOString()` (예: `2026-08-20T00:00:00.000Z`)
- **정렬**: `createdAt` 문자열 비교 내림차순
- 값이 없는 선택 필드는 아예 쓰지 않는다(키 생략).

### 2.1 `parseBuildHeadliner(raw)`
라우트 파라미터와 백업 복원에서도 쓴다.
- 객체가 아니거나 `id`가 문자열이 아니면 → 없음
- `skills`: q/w/e/r만 남긴다. 배열이 아니면 `[]`
- `stickers`: 문자열만 남긴다. 배열이 아니면 `[]`
- 모르는 헤드라이너 ID와 스티커는 **남긴다**(다음 쓰기에서 미래 데이터가 지워지지 않게)

### 2.2 `parseBuilds(raw)`
항목마다 거르고, 목록 전체를 버리는 일은 없다.
- **입력 처리**
  - raw가 null·빈 값·잘못된 JSON·배열 아님 → `[]`
  - null이거나 객체가 아닌 항목 → 버린다
- **항목 정리** (`{...b}`로 펼쳐 모르는 필드도 보존한 뒤)
  - `mode`: 없음·falsy·`'classic'` → `'aram'`
  - `headliner` = `parseBuildHeadliner(b.headliner)`
  - `custom`: 정확히 `true`일 때만 둔다
  - `transmutedIds`: 문자열만. 배열이 아니면 없음
- **남기는 조건**
  - `mode ∈ ['aram']` — arena 등 모르는 모드는 버린다
  - `id`·`championId`·`createdAt`가 문자열
  - `augmentIds`·`itemIds`가 배열(원소 타입은 보지 않음)

### 2.3 캐시·구독·안전장치
- 캐시: 로드 전 = null. 변경이 생기면 구독자에게 알린다(RN `useSyncExternalStore` → 네이티브 `@Observable` / `StateFlow`).
- **readAll**
  - 캐시가 있으면 그대로 쓴다. 없으면 읽기 → parse → 정렬, `readFailed = false`.
  - **읽기가 예외를 던지면**(예: 기기 잠김 중 데이터 보호) 캐시 `[]`, `readFailed = true`.
  - 깨진 JSON은 `readFailed`가 아니다. 다음 저장이 덮어쓴다(RN 동작 유지).
- **readForWrite**
  - `readFailed`면 캐시를 비우고 다시 읽는다.
  - 또 실패하면 `'build storage unreadable'`을 던진다 → 빈 목록으로 디스크를 덮어쓰는 일을 막는다.
- **saveBuild / removeBuild**
  1. 캐시를 먼저 갱신하고 알린다.
  2. 쓴다.
  3. **쓰기가 실패하면 캐시를 되돌리고**, 알리고, 예외를 다시 던진다.
- 기타
  - `reloadBuilds`: 캐시를 null로 만든 뒤 readAll
  - `getBuild(id)`: 캐시에서 찾는다

**테스트 벡터**: `scripts/check-build-storage.ts`
- 저장·삭제 실패 시 롤백, 디스크 불변
- arena 제거, classic → aram, null·날짜 없음·모르는 모드 제거, mode 없음 → aram, 다음 저장 후 생존
- 헤드라이너가 재로드 후 유지, 깨진 헤드라이너여도 빌드 유지, 모르는 ID 보존
- transmutedIds 유지·필터

## 3. 백업 `.alab`

### 3.1 형식
`JSON.stringify(file, null, 2)`. `data`의 값은 저장된 원문 문자열이다(빌드는 JSON 안의 JSON 문자열).
```json
{ "app": "augment-lab", "version": 1, "exportedAt": "2026-08-20T09:30:00.000Z",
  "data": { "builds:v1": "[{\"id\":\"…\"}]", "theme:v1": "dark", "locale:v1": "ko" } }
```
- `BACKUP_KEYS = ['builds:v1','theme:v1','locale:v1']`. 저장된 적 없는 키는 파일에서 빠진다.
- 내보낼 때 `builds:v1`은 정리된 목록 `JSON.stringify(listBuilds())`으로 바꾼다(키가 있을 때만).
- **파일 이름**: `augment-lab-YYYY-MM-DD.alab`, **기기 로컬 날짜** 기준(UTC 아님)

### 3.2 `parseBackup` 검증 (순서대로, 실패하면 해당 코드를 던진다)
1. `not-json`
2. `not-object` (배열 포함)
3. `not-augment-lab` (`app !== 'augment-lab'`)
4. `unsupported-version` (`version !== 1`)
5. `no-data` (없음, 객체 아님, 배열)
6. 화이트리스트: `BACKUP_KEYS` 중 **값이 문자열인 것만** 남기고 나머지는 조용히 버린다
7. `builds-corrupt`: `builds:v1`이 있는데 JSON 배열이 아님

`exportedAt`이 없으면 `''`. theme·locale 값은 검증하지 않는다(읽을 때 보정).

### 3.3 내보내기·가져오기·적용
- **내보내기**: 키를 읽는다 → 캐시 폴더에 파일을 쓴다(같은 이름은 덮어씀) → 공유 시트
  - RN: UTI `public.data`, mime `application/octet-stream`
- **가져오기**: 형식 필터 없는 파일 선택기로 고른 파일의 텍스트를 읽는다.
  - 열기 연동·AirDrop·문서 타입 등록은 **없다**(RN과 동일하게 등록하지 않는다).
  - 확인창에 `parseBuilds(data['builds:v1']).length`개를 보여 준다.
- **적용 = 병합이 아니라 교체**
  1. 파일에 있는 키를 쓴다.
  2. 파일에 없는 `BACKUP_KEYS`를 지운다.
  3. 빌드·로케일·테마 저장소를 다시 불러온다.
  - 쓰기를 먼저 하기 때문에 중간에 실패해도 빈 저장소가 남지 않는다.
- **초기화**: `BACKUP_KEYS`를 지우고 다시 불러온다. `review:requested`와 프리웜 플래그는 남긴다.

**테스트 벡터**: `scripts/check-backup.ts`
- 왕복, 로컬 날짜 파일명(`2026-08-20 04:57` → `augment-lab-2026-08-20.alab`)
- 일부 키만 있어도 통과, 화이트리스트 밖 키 제거, 실패 코드 7종

## 4. 기존 iOS 사용자 데이터 이관 (I-04c)

RN AsyncStorage(v2.2.0)는 다음 위치에 저장한다.
- **폴더**: `Library/Application Support/com.augmentlab/RCTAsyncLocalStorage_V1/`
- **manifest**: `manifest.json`. 평평한 객체 `{ "key": "value" | null }`, UTF-8
- **큰 값**: UTF-16 길이가 1024를 넘으면 별도 파일로 저장하고 manifest에는 `null`을 둔다.
  - 파일 이름 = 키 UTF-8 바이트의 MD5(소문자 hex 32자), 확장자 없음, 내용은 UTF-8 원문
- **미리 계산한 파일 이름**

  | 키 | 파일 |
  |---|---|
  | `builds:v1` | `970e875d66bf736ae9a9465c34219ef6` |
  | `theme:v1` | `d54ded72acf1b50c08fdcd9a66d4a58c` |
  | `locale:v1` | `d17436c0a5da6dfea070d64dda0b0afd` |
  | `review:requested` | `5df9f2cd952dab82411c5481c8c70964` |
  | `prewarm:done:16.16.1` | `d0b80c1bb5f09ba96cc848a13d314361` |

- **읽기 규칙**
  - manifest에 키가 없으면 → 값 없음
  - `null`이면 → md5 파일을 읽는다(파일이 없으면 값 없음)
  - 문자열이면 → 그 값
- **선택 폴백**: `Documents/RCTAsyncLocalStorage_V1`
- **이관 절차**
  1. 새 저장소에 이관 완료 표시가 없을 때 한 번만 실행한다.
  2. 키 5개를 읽어 새 저장소에 그대로 쓴다. `builds:v1`은 §2.2 parse를 거친다.
  3. 완료 표시를 남긴다. **원본 폴더는 지우지 않는다**(되돌릴 길 확보).
- 이미지 캐시: expo-image는 SDWebImage 기본 캐시 `Library/Caches/com.hackemist.SDImageCache/default/`를 쓴다.
  - 네이티브도 SDWebImage 기본 캐시를 쓰면 이어질 수 있다. 캐시 키가 같은지는 I-42에서 확인한다.
  - 이어지지 않아도 프리웜 보충(top-up)이 다시 받는다.
- PostHog 익명 ID(`Documents/.posthog-rn.json`)는 이어 붙이지 않는다(개선 후보).
- Android: 증강연구소 기존 사용자가 없다. porcana 잔여 데이터 정리만 한다(A-45).

## 5. 설정

**로케일**
- 시작할 때 저장값을 읽는다. 없으면 기기 언어로 정한다(§1).
- 바꾸면 즉시 전체 화면에 반영하고(재시작 없음) 저장한다.
- 읽기 오류면 현재 값을 유지한다.

**테마**
- `system`/`light`/`dark`. 창 전체 스타일을 강제로 바꾼다(iOS `overrideUserInterfaceStyle`).
- `system`인데 기기 값을 모르면 light로 본다.

**번역 패턴**
- 파일 위에 `{ko:{…}, en:{…}}` 사전을 두고 `t(key)`로 꺼낸다.
- 키가 없으면 `en` → `''` 순으로 폴백한다. 이 패턴은 세 앱 모두 그대로 쓴다.

## 6. 리뷰 요청 (`lib/review.ts`)

- 빌드 상세가 로드되고 **`saved` 파라미터가 있을 때**, 1000ms 뒤에 다음을 순서대로 확인한다.
  1. `review:requested`가 없다
  2. 정리된 빌드 수가 2개 이상이다(방금 저장한 것 포함)
  3. 스토어 리뷰를 쓸 수 있다
- 모두 통과하면 `'1'`을 **먼저** 저장하고 요청한다. 오류는 전부 삼킨다. 평생 한 번만 묻는다.
- Android: Play In-App Review API
