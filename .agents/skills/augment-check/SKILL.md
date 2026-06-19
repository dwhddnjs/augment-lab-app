---
name: augment-check
description: "증강 데이터(src/features/augments/data/augments.{ko,en}.json)를 수정·추가·삭제할 때마다 검수 페이지(docs/augment-check.html)를 재생성하는 절차. 증강 아이콘 경로(CDragon Kiwi 폴더) 원칙 포함. 증강 데이터를 건드릴 때 반드시 읽고 따를 것."
version: 1.0.0
license: MIT
---

# 증강 데이터 변경 → 검수 페이지 갱신

`src/features/augments/data/augments.{ko,en}.json`을 **수정·추가·삭제할 때마다** 검수 페이지를 반드시 재생성한다:

```bash
node scripts/gen-augment-check.mjs   # → docs/augment-check.html
```

- 검수 페이지는 ko/en을 `id`로 병합해 199개 증강을 rarity별로 보여주고, 앱과 동일한 `augmentImageUrl(large)` 규칙으로 CDragon 아이콘을 렌더한다.
- 같은 아이콘 파일을 공유하는 증강은 **"공유" 배지**로 표시(오류 아님).
- 데이터 변경 후 `docs/augment-check.html`도 **함께 커밋**할 것.

## 아이콘 경로 원칙

- **ARAM Mayhem 증강은 `.../UX/Kiwi/Augments/Icons/...` 폴더 사용**. `Cherry`/`Strawberry`(Arena) 폴더를 쓰지 말 것.
- CDragon `cherry-augments.json`에서 rarity(`kSilver`/`kGold`/`kPrismatic`)가 데이터와 일치하는 `Kiwi` 항목을 정답으로 삼는다.
