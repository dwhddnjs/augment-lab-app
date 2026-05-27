# 데이터 인프라 구축 플랜 — ARAM Augment Lab

## Context

현재 앱은 순수 Expo SDK 56 스타터 상태로, LoL 도메인 데이터(챔피언/아이템/증강), 데이터 페칭 레이어, 상태 관리, 자산 모두 부재. 앱이 동작하려면 다음이 필요:
- ARAM Mayhem 증강 정보/설명
- 챔피언 정보 + 기본 스탯
- 아이템 정보 + 스탯
- 위 세 종류의 이미지
- 향후 유저 데이터(즐겨찾기/내 빌드) 클라우드 동기화

언어: 한국어 + 영어 둘 다. 데이터는 정적(패치 단위 갱신), 유저 데이터는 클라우드.

## Supabase 무료 정책 (확인 결과)

- **활성 프로젝트 2개** 무료 (1개 아님)
- DB가 **1주일 비활성** 시 자동 일시정지 → 깨우는 데 ~30초
- 500MB DB / 1GB 파일 스토리지 / 50K MAU / 2M 실시간 메시지

→ 정적 LoL 데이터를 Supabase에 넣을 이유는 없음(낭비). **유저 데이터 전용**으로만 사용. 일시정지 회피는 클라이언트 active 호출이 있는 한 자연스럽게 해결됨.

## 아키텍처 결정

| 데이터 종류 | 저장 위치 | 이미지 |
|---|---|---|
| 챔피언 | 앱 번들 JSON (한+영) | ddragon CDN (런타임, expo-image 캐시) |
| 아이템 | 앱 번들 JSON (한+영) | ddragon CDN |
| ARAM Mayhem 증강 | 앱 번들 JSON (한+영) | CDragon raw CDN |
| 유저 즐겨찾기/빌드 | Supabase (Postgres + Auth) | — |

이유: 정적 데이터는 패치마다만 변하고 작음(<5MB). 번들이면 오프라인 작동 + 첫 로드 즉시 + 무료. 이미지는 CDN에 이미 호스팅되어 있으므로 `expo-image`로 직접 로드(디스크 캐시 자동).

## 1. 데이터 소스

### 챔피언 / 아이템 (Data Dragon — 공식)
- 버전 목록: `https://ddragon.leagueoflegends.com/api/versions.json`
- 챔피언: `https://ddragon.leagueoflegends.com/cdn/{ver}/data/{ko_KR|en_US}/champion.json` (목록)
- 챔피언 상세: `https://ddragon.leagueoflegends.com/cdn/{ver}/data/{locale}/champion/{ChampId}.json` (스킬/스탯)
- 아이템: `https://ddragon.leagueoflegends.com/cdn/{ver}/data/{locale}/item.json`
- 이미지:
  - 챔피언 스퀘어: `…/cdn/{ver}/img/champion/{ChampId}.png`
  - 챔피언 로딩: `…/cdn/img/champion/loading/{ChampId}_0.jpg`
  - 아이템: `…/cdn/{ver}/img/item/{itemId}.png`

### ARAM Mayhem 증강 (주의 — 공식 소스 없음)

CDragon raw에는 `cherry-augments.json`(Arena 모드)만 있고 ARAM Mayhem 전용 JSON은 없음. 옵션:

**옵션 A (권장)**: League of Legends Wiki의 `Module:MayhemAugmentData/data`를 빌드 스크립트로 파싱.
- 위키는 패치마다 커뮤니티가 업데이트함
- Lua 모듈 형식이므로 정규식 파서 또는 mw API로 변환
- 이미지: 위키 페이지에서 추출하거나 CDragon `assets` 경로 추측

**옵션 B**: `arammayhem.com` 같은 3자 사이트 스크래핑(ToS 위험 + 불안정).

**옵션 C**: 손으로 JSON 작성하고 패치마다 수동 업데이트(가장 안정적이지만 운영 비용 발생).

→ **A로 시도하되, 실패 시 C로 폴백.** 초기 PoC는 소량(20~30개)을 손으로 작성해 스키마 먼저 확정.

## 2. 디렉터리 구조 추가

```
scripts/
  fetch-data/
    fetch-ddragon.ts     # 챔피언/아이템 ko_KR + en_US 다운로드
    fetch-augments.ts    # ARAM Mayhem 증강 (Wiki 파싱)
    index.ts             # 위 두 개 실행, src/data/ 에 출력
src/
  data/
    version.json         # { ddragonVersion, generatedAt }
    champions.ko.json
    champions.en.json
    items.ko.json
    items.en.json
    augments.ko.json
    augments.en.json
  types/
    champion.ts
    item.ts
    augment.ts
  lib/
    ddragon.ts           # 이미지 URL 빌더 (버전 기반)
    supabase.ts          # 클라이언트 초기화 (런타임)
    queries/
      favorites.ts       # 유저 즐겨찾기 CRUD
      builds.ts          # 내 빌드 CRUD
  hooks/
    use-locale.ts        # ko/en 토글, 적절한 JSON 반환
    use-champions.ts
    use-items.ts
    use-augments.ts
```

## 3. 추가 의존성

- `@supabase/supabase-js` — Supabase 클라이언트
- `@react-native-async-storage/async-storage` — Supabase 세션 저장
- `react-native-url-polyfill` — Supabase RN 호환
- `zod` (선택) — JSON 스키마 검증, 빌드 스크립트에서 사용
- `expo-image`: 이미 있음 — 그대로 사용

상태/페칭 라이브러리는 정적 JSON이므로 우선 보류. 유저 데이터가 늘면 `@tanstack/react-query` 도입 검토.

## 4. 변경/생성할 핵심 파일

- **생성**: `scripts/fetch-data/*`, `src/data/*`, `src/types/*`, `src/lib/*`, `src/hooks/use-{champions,items,augments,locale}.ts`
- **수정**: `package.json`(스크립트 `"data:refresh"` 추가, 의존성)
- **수정**: `tsconfig.json`(JSON resolve 옵션 확인 — `resolveJsonModule`)
- **신규 env**: `.env`(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY), `.gitignore`에 추가

## 5. Supabase 초기 스키마 (유저 데이터 전용)

```sql
-- profiles: auth.users 연동 (Supabase Auth 사용 시 자동)
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  entity_type text check (entity_type in ('champion','item','augment')),
  entity_id text not null,
  created_at timestamptz default now(),
  unique(user_id, entity_type, entity_id)
);
create table builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  champion_id text not null,
  item_ids text[] not null default '{}',
  augment_ids text[] not null default '{}',
  created_at timestamptz default now()
);
-- RLS: 자기 데이터만 읽기/쓰기
```

RLS 정책 필수. 인증 방식은 추후 결정(이메일/OAuth).

## 6. 구현 순서

1. `scripts/fetch-data/fetch-ddragon.ts` 작성 → 챔피언/아이템 JSON 생성 + 타입 정의
2. `src/lib/ddragon.ts` 이미지 URL 빌더 + 첫 화면(챔피언 목록)으로 expo-image 동작 확인
3. ARAM Mayhem 증강 PoC — 손으로 작은 샘플 JSON 만들어 화면에 표시
4. Wiki 파싱 스크립트 작성 (실패 시 수동 유지로 결정)
5. Supabase 프로젝트 생성 + 스키마 + RLS, 클라이언트 연동, 즐겨찾기 토글 동작
6. `npm run data:refresh` 워크플로 문서화 (CLAUDE.md 갱신)

## 7. 검증 방법

- `npm run data:refresh` 후 `src/data/` JSON 파일 생성 확인 (챔피언 ~170개, 아이템 ~200개)
- `npm start` → iOS/Android에서 챔피언 목록 스크롤, 이미지 로딩(첫 로드 후 캐시 확인)
- 한/영 토글 시 텍스트 전환
- Supabase: 익명 로그인 → 즐겨찾기 추가 → 앱 재시작 후 유지 확인. 다른 유저로 로그인 시 자기 데이터만 보이는지 RLS 검증
- 오프라인 모드(비행기 모드)에서 정적 데이터 화면 표시되는지 확인 (이미지는 캐시된 것만)

## 8. 열린 이슈 (후속 결정)

- **Riot 게임 라이선스**: ARAM Mayhem 증강 데이터를 Wiki에서 가져올 경우 CC-BY-SA 표기 필요. 앱 내 크레딧 화면.
- **승률 표시 금지**: Riot 정책상 증강/Arena 아이템 승률 표시 불가 — 향후 데이터 추가 시 주의.
- **이미지 사전 다운로드**: 오프라인 완전 지원 원하면 `expo-image` `prefetch` 또는 빌드 시 `assets/`로 다운로드 검토(앱 크기 증가).

## 9. 플랜 문서 보관

본 플랜은 승인 후 `docs/plans/2026-05-28-data-infra.md`로 복사 저장 (CLAUDE.md 규칙).
