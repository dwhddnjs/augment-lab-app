/**
 * 챔피언 Q/W/E/R 이름·아이콘 파일명을 DDragon championFull.json 에서 뽑아
 * features/champions/data/champion-spells.{ko,en}.json 으로 쓴다. 펜타킬 헤드라이너가 쓴다.
 *
 * 파일명은 챔피언마다 제각각이라(ApheliosQ_ClientTooltipWrapper.png) 규칙으로 만들 수 없다.
 * version.json 의 버전을 그대로 따라야 앱이 그리는 img/spell 경로와 어긋나지 않는다 —
 * fetch-ddragon.ts 가 버전을 올린 뒤에 돌도록 npm run data:refresh 에 이어 붙였다.
 *
 * Run: npx tsx scripts/fetch-data/fetch-champion-spells.ts
 */

import fs from 'fs';
import path from 'path';
import type { ChampionSpells } from '../../src/features/champions/types';
import versionData from '../../src/lib/version.json';

const DATA_DIR = path.resolve(__dirname, '../../src/features/champions/data');
const LOCALES = { ko: 'ko_KR', en: 'en_US' } as const;
const SKILL_KEYS = ['q', 'w', 'e', 'r'] as const;

async function fetchSpells(locale: string): Promise<Record<string, ChampionSpells>> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${versionData.ddragonVersion}/data/${locale}/championFull.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} (${res.status})`);
  const { data } = (await res.json()) as { data: Record<string, any> };

  return Object.fromEntries(
    Object.entries(data).map(([id, champion]) => {
      if (champion.spells.length !== SKILL_KEYS.length) {
        throw new Error(`${id}: 스킬이 ${champion.spells.length}개다`);
      }
      const spells = SKILL_KEYS.map((key, i) => [
        key,
        { name: champion.spells[i].name, image: champion.spells[i].image.full },
      ]);
      return [id, Object.fromEntries(spells) as ChampionSpells];
    }),
  );
}

async function main() {
  for (const [suffix, locale] of Object.entries(LOCALES)) {
    const spells = await fetchSpells(locale);
    fs.writeFileSync(
      path.join(DATA_DIR, `champion-spells.${suffix}.json`),
      JSON.stringify(spells, null, 2) + '\n',
    );
    console.log(`${locale}: ${Object.keys(spells).length} champions`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
