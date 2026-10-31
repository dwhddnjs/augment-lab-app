import type { HeadlinerId, StickerId } from './types';

// 로고는 위키 원본, 초상은 CDragon kiwi_s3_band_heartsteel_augmentcard_character_* (게임 카드 장식).
// 등장 연출에서 바로 떠야 해서 앱에 넣어 둔다.
export const HEADLINER_LOGOS: Record<HeadlinerId, number> = {
  kda: require('@/assets/headliners/kda.png'),
  pentakill: require('@/assets/headliners/pentakill.png'),
  heartsteel: require('@/assets/headliners/heartsteel.png'),
  'true-damage': require('@/assets/headliners/true-damage.png'),
  disco: require('@/assets/headliners/disco.png'),
  'cafe-cuties': require('@/assets/headliners/cafe-cuties.png'),
  bees: require('@/assets/headliners/bees.png'),
  'command-line': require('@/assets/headliners/command-line.png'),
};

/** 게임의 K/DA 마스크(kiwi_s3_bandlogo_kda_v3_mask)에 인게임처럼 얼음빛 그라데이션과 파란 글로우를 입혔다. */
export const KDA_MARK: number = require('@/assets/headliners/kda-mark.png');

/**
 * 커맨드 라인 리롤 버튼. 게임 로고(kiwi_s3_bandlogo_project_v2)를 금색으로 입혔고, flash 는 번쩍이는 순간의
 * 레이어다. 글로우는 밝은 배경에서 형태를 뭉개서 라이트 모드(iconLight)는 진한 외곽선으로 구분한다.
 */
export const COMMAND_LINE_REROLL = {
  icon: require('@/assets/headliners/command-line-reroll.png') as number,
  iconLight: require('@/assets/headliners/command-line-reroll-light.png') as number,
  flash: require('@/assets/headliners/command-line-reroll-flash.png') as number,
};

/** 라이트 모드 헤더용 커맨드 라인 로고. 리롤 버튼의 iconLight 와 같은 외곽선 스타일이다. */
export const COMMAND_LINE_LOGO_LIGHT: number = require('@/assets/headliners/command-line-light.png');

/** 펜타킬 스킬 카드. 게임의 증강 카드 원본(ux/cherry·kiwi/augments/augmentselection)이다. */
export const SKILL_CARD_ART = {
  background: require('@/assets/headliners/skill-card-bg.png') as number,
  frame: require('@/assets/headliners/skill-card-frame.png') as number,
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
