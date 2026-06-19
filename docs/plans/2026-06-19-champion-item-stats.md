# 챔피언 스탯 확장 + 아이템 정확 합산 표시

## Context (배경)

아이템 선택 화면(`item-select-screen`)과 빌드 상세 화면(`build-detail-screen`)의 스탯 정보 박스가 빈약하다. 근본 원인은 데이터 소스다:

- 챔피언/아이템 데이터는 DDragon에서 가져오는데, DDragon의 아이템 `stats` 필드는 **레거시**라 12종(체력·공격력·주문력·방어력·마법저항·마나·공격속도·이동속도·치명타확률·체력재생 일부)만 담고 있다.
- 현대 LoL 스탯인 **스킬 가속·물리/방어구/마법 관통력·치명타 피해량·모든 피해 흡혈·강인함·체력 회복 및 보호막 효과·마나 재생** 등은 `stats`에 **아예 없다**.
- 다만 각 아이템 `description`의 `<stats>` 블록에는 이 모든 스탯이 **정확한 수치**로 들어있다 (예: 야수화 → "공격력 25, 스킬 가속 10, 물리 관통력 5"). 전수 조사로 21종 라벨이 모두 정확값 추출 가능함을 확인했다.

**목표**: ① description 파싱으로 아이템 stats를 정확히 재생성하고, ② 스탯 표시 항목을 LoL 전체 스탯으로 확장하며, ③ 각 항목을 `총합 (+아이템 추가분)` 형태로 표시한다. 기본값이 0인 순수 아이템 스탯(스킬 가속 등)은 값만 표시한다.

> 구현 착수 시 이 문서를 `docs/plans/2026-06-19-champion-item-stats.md`로 복사할 것 (CLAUDE.md 규칙).

---

## 검수 결과 — description `<stats>` 라벨 → 정규화 키 매핑

ko.json 254개 아이템 description에서 실제 등장한 라벨과 매핑(값에 `%`가 붙으면 percent, 아니면 flat):

| description 라벨 | 정규화 키 | 단위 | 챔피언 기본값 |
|---|---|---|---|
| 체력 | `hp` | flat | 있음 |
| 마나 | `mp` | flat | 있음 |
| 공격력 | `attackdamage` | flat | 있음 |
| 주문력 | `abilitypower` | flat | 0 |
| 방어력 | `armor` | flat | 있음 |
| 마법 저항력 | `spellblock` | flat | 있음 |
| 공격 속도 | `attackspeed` | % | 있음 |
| 이동 속도 | `movespeedFlat`/`movespeedPercent` | flat/% | 있음 |
| 기본 체력 재생 | `hpregen` | % | 있음 |
| 기본 마나 재생 | `mpregen` | % | 있음 |
| 스킬 가속 | `abilityhaste` | flat | 0 |
| 치명타 확률 | `crit` | % | 0 |
| 치명타 피해량 | `critdamage` | % | 0 |
| 물리 관통력 | `lethality` | flat | 0 |
| 방어구 관통력 | `armorpen` | % | 0 |
| 마법 관통력 | `magicpenFlat`/`magicpenPercent` | flat/% | 0 |
| 생명력 흡수 | `lifesteal` | % | 0 |
| 모든 피해 흡혈 | `omnivamp` | % | 0 |
| 강인함 | `tenacity` | % | 0 |
| 체력 회복 및 보호막 | `healshield` | % | 0 |
| 적응형 능력치 | `adaptive` | flat | 0 |
| 초당 골드 | — (스탯 아님, 패널 제외) | — | — |

사거리(`attackrange`)는 아이템 description엔 거의 없고 챔피언 기본값만 사용 → 기본값만 표시.

---

## 변경 사항

### 1. 데이터 재생성 스크립트 (신규) — `scripts/parse-item-stats.mjs`
- `src/features/items/data/items.ko.json`을 읽어 각 아이템 `description`의 `<stats>...</stats>` 블록을 정규식으로 파싱.
- 위 매핑 테이블로 정규화된 stats 객체 생성. 값의 `%` 유무로 flat/percent 분기(이동속도·마법관통력).
- `items.ko.json`·`items.en.json` 두 파일의 `stats` 필드를 **동일하게** 덮어씀 (수치는 로케일 무관, en은 영어 라벨이라 ko로 파싱한 결과를 그대로 적용).
- **검수 로그 출력**: 매핑되지 않은 라벨이 있으면 경고로 출력(향후 신규 라벨 누락 방지), 아이템별 변경 요약. `package.json`에 `data:item-stats` 스크립트 추가.

### 2. `src/features/items/types.ts` — `ItemStats` 확장
기존 `FlatHPPoolMod` 등 레거시 키를 정규화 키 체계로 교체:
```ts
export interface ItemStats {
  hp?: number; mp?: number; attackdamage?: number; abilitypower?: number;
  armor?: number; spellblock?: number;
  attackspeed?: number;          // %
  movespeedFlat?: number; movespeedPercent?: number;
  hpregen?: number; mpregen?: number;   // %
  abilityhaste?: number;
  crit?: number; critdamage?: number;   // %
  lethality?: number; armorpen?: number;        // armorpen %
  magicpenFlat?: number; magicpenPercent?: number;
  lifesteal?: number; omnivamp?: number;        // %
  tenacity?: number; healshield?: number;       // %
  adaptive?: number;
}
```

### 3. `src/features/items/stats.ts` — 합산 로직·라벨 확장
- `computeStats()` 반환을 항목별 `{ base, added, total }`로 확장(또는 `base`/`added` 두 객체). 표시단에서 `total`과 `added`를 함께 쓰기 위함.
- 챔피언 기본값 합산: hp/mp/ad/armor/mr는 flat 더하기, attackspeed/movespeed/hpregen/mpregen은 base에 % 또는 flat 적용. 기본값 0인 신규 스탯은 아이템 합만.
- `adaptive`(적응형 능력치)는 표시 단계에서 별도 "적응형 능력치" 행으로 노출(AD/AP 분기 없이 합산값 그대로).
- `STAT_DISPLAY_ORDER` 확장: hp, hpregen, mp, mpregen, attackdamage, abilitypower, armor, spellblock, attackspeed, abilityhaste, crit, critdamage, lethality, armorpen, magicpen, lifesteal, omnivamp, movespeed, tenacity, healshield, attackrange, adaptive.
- `STAT_LABELS`에 신규 항목 ko/en + `unit`(`%`) + **`hasBase` 플래그**(기본값 존재 여부 — 표시 규칙 분기용) 추가.

### 4. `src/features/items/components/item-stat-panel.tsx` — `총합 (+추가분)` 렌더
- 각 행: `hasBase`이고 `added > 0`이면 `{total}{unit} (+{added}{unit})`, 아니면 `{total}{unit}`.
- **숨김 규칙**: `total === 0 && added === 0`인 행은 렌더하지 않음(현재 mp/abilitypower/lifesteal 0 숨김 로직을 일반화).
- 공격속도는 소수점 3자리 유지, 나머지 정수.

### 5. 데이터 파일 — `items.ko.json` / `items.en.json`
스크립트로 `stats` 필드 재생성(254개). 커밋에 포함.

---

## 재사용하는 기존 코드
- `src/features/items/stats.ts`의 `computeStats`/`STAT_DISPLAY_ORDER`/`STAT_LABELS` 구조를 확장(신규 파일 X).
- `ItemStatPanel`은 두 화면(`item-select-screen`, `build-detail-screen`)이 공유 → 한 컴포넌트 수정으로 양쪽 반영.
- `item-detail-panel.tsx`는 `ItemStatPanel`을 래핑만 하므로 수정 불필요.
- 데이터 fetch 패턴은 `scripts/fetch-data/fetch-ddragon.ts` 참고(단, 본 작업은 외부 fetch 없이 로컬 파싱).

## i18n
신규 스탯 라벨은 `STAT_LABELS`의 `{ ko, en }` 사전으로 처리(기존 패턴 그대로). 컴포넌트는 `useLocale()`로 분기.

---

## Verification (검증)

1. **스크립트 검수**: `node scripts/parse-item-stats.mjs` 실행 → 매핑 누락 경고 0건 확인. 대표 아이템 출력 대조:
   - 무한의 대검 → 공격력/치명타 확률/치명타 피해량 30%
   - 야수화 → 공격력 25 / 스킬 가속 10 / 물리 관통력 5
   - 마법사의 신발 → 마법 관통력 12 / 이동 속도 %
   - 끝없는 갈망 → 강인함 20% / 생명력 흡수 / 체력
2. **타입체크/린트**: `npm run lint` 통과.
3. **앱 실행**(`npm run ios`): 아이템 선택 화면에서
   - 챔피언 선택 후 아이템 0개 → 기본 스탯만(괄호 없음), 사거리·체력재생 등 노출.
   - 무한의 대검+야수화 등 선택 → `공격력 145 (+85)`, `스킬 가속 10`, `치명타 피해량 30%` 형태로 합산 표시.
   - 빌드 상세 화면에서도 동일 패널이 같은 형식으로 렌더되는지 확인.
4. base가 0인 항목은 `(+n)` 없이 값만 나오는지, total·added 모두 0인 항목은 숨겨지는지 확인.
