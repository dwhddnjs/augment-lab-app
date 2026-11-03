import type { HeadlinerId, StickerId } from './types';

/**
 * 헤드라이너 로고 한 벌. 로고별 예외는 여기에만 둔다 — 그리는 쪽(헤더·등장 연출·판 위 로고)은 이 표만 읽는다.
 * - light: 라이트 모드 판 없는 자리(헤더)에 쓸 그림. 없으면 source 를 그대로 쓴다.
 * - aspect: 판 없이 그릴 때 상자의 가로:세로. 기본 1 — 정사각 상자에 contain 한다.
 * - ink: 상자 대비 실제 그림(투명 여백·번진 빛 제외) 비율. 정사각 로고는 긴 변, 가로로 긴 K/DA 는 높이다. 기본 1.
 */
export interface HeadlinerLogoArt {
  source: number;
  light?: number;
  aspect?: number;
  ink?: number;
}

// 로고는 위키 원본, 초상은 CDragon kiwi_s3_band_heartsteel_augmentcard_character_* (게임 카드 장식).
// 등장 연출에서 바로 떠야 해서 앱에 넣어 둔다.
export const HEADLINER_LOGOS: Record<HeadlinerId, HeadlinerLogoArt> = {
  // 게임의 K/DA 마스크(kiwi_s3_bandlogo_kda_v3_mask)에 인게임처럼 얼음빛 그라데이션과 파란 글로우를 입혔다.
  // 위키 원본은 보랏빛 글로우라 드래프트 파랑과 어긋나 쓰지 않는다. 500×147 이고 글로우 여백을 빼면 높이의 73% 가 그림이다.
  kda: { source: require('@/assets/headliners/kda-mark.png'), aspect: 500 / 147, ink: 0.73 },
  pentakill: { source: require('@/assets/headliners/pentakill.png') },
  heartsteel: { source: require('@/assets/headliners/heartsteel.png') },
  'true-damage': { source: require('@/assets/headliners/true-damage.png') },
  disco: { source: require('@/assets/headliners/disco.png') },
  'cafe-cuties': { source: require('@/assets/headliners/cafe-cuties.png') },
  bees: { source: require('@/assets/headliners/bees.png'), ink: 0.8 },
  'command-line': {
    source: require('@/assets/headliners/command-line.png'),
    // 원본 금색은 밝은 배경에서 빛 번짐이 묻혀 흐려지고, 단색으로 칠하면 금속 질감이 사라져 탁한 갈색이 된다.
    // 원본 위에 진한 금색(#6B4A0E) 그림자를 은은하게 깔아(캔버스 512 기준 아래 8px·번짐 10px·55%) 금색을 살린 채 윤곽만 세웠다.
    light: require('@/assets/headliners/command-line-light.png'),
    // 번진 빛 때문에 82% 만 그림이다.
    ink: 0.82,
  },
};

/** 커맨드 라인 리롤 버튼. 게임 로고(kiwi_s3_bandlogo_project_v2)를 금색으로 입혔고, flash 는 번쩍이는 순간의 레이어다. */
export const COMMAND_LINE_REROLL = {
  icon: require('@/assets/headliners/command-line-reroll.png') as number,
  /** 라이트 모드용 — HEADLINER_LOGOS['command-line'].light 와 같은 그림자(256 캔버스라 절반 크기). */
  lightIcon: require('@/assets/headliners/command-line-reroll-light.png') as number,
  flash: require('@/assets/headliners/command-line-reroll-flash.png') as number,
};

/**
 * 펜타킬 스킬 카드에만 있는 장식. 게임 원본(ux/kiwi/augments/augmentselection)이다.
 * 배경과 골드 프레임은 증강 카드와 같은 것을 쓴다(AUGMENT_CARD_ART).
 */
export const SKILL_CARD_ART = {
  swirl: require('@/assets/headliners/skill-card-swirl.png') as number,
  iconFrame: require('@/assets/headliners/skill-card-icon-frame.png') as number,
};

export const STICKER_PORTRAITS: Record<StickerId, number> = {
  aphelios: require('@/assets/headliners/sticker-aphelios.png'),
  ezreal: require('@/assets/headliners/sticker-ezreal.png'),
  kayn: require('@/assets/headliners/sticker-kayn.png'),
  ksante: require('@/assets/headliners/sticker-ksante.png'),
  sett: require('@/assets/headliners/sticker-sett.png'),
  yone: require('@/assets/headliners/sticker-yone.png'),
};
