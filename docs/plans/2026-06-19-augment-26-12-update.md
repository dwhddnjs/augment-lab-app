# 26.12 패치 증강 데이터 갱신

## Context

26.12 패치(증강 칼바람 3.0 개편)로 일부 증강이 삭제·추가되었다. 사용자가 삭제/신규 목록을 제공했고
"아이콘과 설명은 필수"라고 강조했다. 현재 `augments.{ko,en}.json`은 258개로 이미 한 차례 일부 갱신된
상태라, 사용자 목록을 정답으로 삼아 **현재 데이터와 대조한 차집합만** 반영했다(전량 교체 아님).

데이터 소스: CDragon `cherry-augments.json`(ko/en)에서 id·정식 한/영명·rarity·아이콘 경로 확정.
CDragon에는 설명이 없어 설명은 arammayhem.com / mobalytics에서 확보해 한글로 작성.

## 변경 파일

- `src/features/augments/data/augments.ko.json`
- `src/features/augments/data/augments.en.json`
- `docs/augment-check.html` (`scripts/gen-augment-check.mjs`로 재생성)

스키마: `{ id, name, description, rarity, iconPath }` (`src/features/augments/types.ts`). ko/en은 `id`로 매칭.

## 반영 결과 (258 → 225)

### 1. 삭제 38개
사용자 삭제 목록 40개 중 데이터에 남아있던 38개를 ko/en에서 id 매칭 제거.
("선동", "개척자"는 이미 데이터에 없어 조치 불필요)

### 2. 추가 5개
| id | ko / en | rarity | iconPath |
|---|---|---|---|
| `pursuit-of-power` | 위력 추구 / Pursuit of Power | silver※ | `.../Cherry/Augments/Icons/Marksmage_small.png` |
| `endless-decimation` | 끝없는 학살 / Endless Decimation | gold | `.../Cherry/Augments/Icons/EndlessDecimate_small.png` |
| `terraind` | 지형 생성됨 / Terrain'd | gold | `.../Cherry/Augments/Icons/LightningStrikes_small.png` |
| `pin-cushion` | 바늘꽂이 / Pin Cushion | prismatic | `.../Cherry/Augments/Icons/SymphonyOfWar_small.png` |
| `one-trick` | 특기 빼면 시체 / One Trick | prismatic | `.../Kiwi/Augments/Icons/GenericAbilityAugmentIcon_Prismatic.png` |

- ※`위력 추구`: CDragon은 `kGold`이나 사용자 지정대로 **silver** 적용. 아이콘은 "마법 명사수"와 공유(검수 페이지 "공유" 배지 정상).
- `특기 빼면 시체`(`one-trick`): CDragon·영문 DB·나무위키 모두에서 매칭 실패 → **영문명/설명/아이콘 잠정**. ability augment 추정으로 generic 프리즘 아이콘 + 추정 설명 사용. 추후 정식 데이터 확보 시 교체 필요.

### 3. 빈 설명 6개 보완 (기존 데이터 결함 수정)
설명이 비어있던 기존 항목을 arammayhem.com에서 확보해 채움:
`multishot`(다중 공격), `quickstep`(날쌘걸음), `wee-woo-wee-woo`(삐뽀삐뽀),
`yowch-my-coins`(으악, 내 동전!), `pressure-cooker`(압력솥), `snowblast`(눈 폭발)

### 4. 추가하지 않음 (이미 존재 — 사용자 표기 vs 정식 한글명 차이)
- `2연속 방어` = **보강**(Bolstered, nameId `DoubleDefense`)
- `퀘스트: 서포터 주력` = **서포터 주력**(Support Main)
- `이빨의 요정` = **이빨 요정**(Tooth Fairy)
- 그 외 신규 목록 다수(대마법사·연쇄 반응·앙파상·3연발 등)

## 검증 결과

- ko.length === en.length === 225, ko/en id 집합 동일 ✓
- 삭제 38개 부재 / 추가 5개 존재 / 모든 항목 필수필드(id·name·description·rarity·iconPath) 채움 ✓
- rarity 분포: silver 64 · gold 84 · prismatic 77
- `node scripts/gen-augment-check.mjs` → `docs/augment-check.html` 재생성(225개, 공유 아이콘 39) ✓
- `npm run lint` 통과(exit 0) ✓

## 후속

- `특기 빼면 시체`(`one-trick`): 정식 영문명·아이콘·설명 확정 시 교체.
- 커밋 시 `augments.{ko,en}.json` + `docs/augment-check.html` 함께 커밋(augment-check SKILL).
