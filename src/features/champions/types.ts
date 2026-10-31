export interface ChampionStats {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
}

export interface Champion {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  stats: ChampionStats;
  imageKey: string; // ddragon image file key (e.g. "Aatrox.png")
}

export interface ChampionSpell {
  name: string;
  image: string; // ddragon img/spell file key (e.g. "ApheliosW.png")
}

export type ChampionSpells = Record<'q' | 'w' | 'e' | 'r', ChampionSpell>;
