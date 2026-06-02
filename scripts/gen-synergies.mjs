import fs from "node:fs";

const data = JSON.parse(
  fs.readFileSync("src/features/augments/data/augments.en.json", "utf8"),
);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const byNorm = {};
for (const a of data) byNorm[norm(a.name)] = a.id;
const id = (n) => {
  const x = byNorm[norm(n)];
  if (!x) throw new Error("no id for " + n);
  return x;
};

// Official ARAM Mayhem "Augment Sets" (patch 26.3) — source: arammayhem.com.
const defs = [
  {
    id: "firecracker",
    ko: "폭죽",
    en: "Firecracker Set",
    dko: "미사일 계열 증강을 모으면 미사일이 주변 적에게 추가로 튕기며 피해를 입힙니다.",
    den: "Firecracker missiles bounce to nearby enemies for extra damage.",
    icon: "sf:sparkles",
    members: ["Typhoon", "Light em Up", "Twin Fire", "Critical Missile", "Magic Missile", "Fan The Hammer"],
  },
  {
    id: "archmage",
    ko: "대마법사",
    en: "Archmage",
    dko: "스킬을 시전할 때마다 다른 스킬의 쿨다운을 일부 환급합니다.",
    den: "Casting a spell refunds a portion of another spell's cooldown.",
    icon: "sf:wand.and.stars",
    members: ["Juiced", "Mind to Matter", "Buff Buddies", "Ocean Soul", "Overflow"],
  },
  {
    id: "dive-bomb",
    ko: "급강하 폭격",
    en: "Dive Bomb Set",
    dko: "죽음을 활용해 참 피해를 입히고 부활 시간을 단축합니다.",
    den: "Leverage your death for true damage and reduced respawn time.",
    icon: "sf:arrow.down.circle.fill",
    members: ["Dive Bomber", "Self Destruct", "Final City Transit", "Clown College"],
  },
  {
    id: "fully-automated",
    ko: "완전 자동화",
    en: "Fully Automated",
    dko: "자동 시전(Autocast) 스킬의 재사용 대기시간을 감소시킵니다.",
    den: "Reduce the cooldown of your Autocast abilities.",
    icon: "sf:gearshape.fill",
    members: ["FireFox", "Frost Wraith", "Self Destruct", "Ok Boomerang", "Sonata", "Divine Intervention", "Quantum Computing", "Prom Queen"],
  },
  {
    id: "high-roller",
    ko: "큰손",
    en: "High Roller",
    dko: "미니언 처치 시 일정 확률로 능력치 모루를 떨어뜨립니다.",
    den: "Minions have a chance to drop Stat Anvils on death.",
    icon: "sf:dice.fill",
    members: ["Transmute Prismatic", "Transmute Chaos", "Pandoras Box", "Stats", "Stats on Stats", "Stats on Stats on Stats"],
  },
  {
    id: "make-it-rain",
    ko: "돈벼락",
    en: "Make it Rain",
    dko: "적 처치 시 아군이 주울 수 있는 골드 코인을 떨어뜨립니다.",
    den: "Takedowns drop gold coins for you and allies to pick up.",
    icon: "sf:cloud.rain.fill",
    members: ["Upgrade Immolate", "Upgrade Collector", "From Beginning To End", "Donation", "Red Envelopes", "Goldrend", "Heads Up Cupcake"],
  },
  {
    id: "snowday",
    ko: "눈 오는 날",
    en: "Snowday",
    dko: "눈덩이 계열 증강에 스킬 가속과 추가 피해를 부여합니다.",
    den: "Snowball augments gain Ability Haste and bonus damage.",
    icon: "sf:snowflake",
    members: ["Snowball Upgrade", "Snowball Roulette", "Pinball", "Biggest Snowball Ever", "Holy Snowball"],
  },
  {
    id: "stackosaurus-rex",
    ko: "스택사우루스",
    en: "Stackosaurus Rex",
    dko: "스택을 획득할 때마다 추가 스택을 더 얻습니다.",
    den: "Whenever you gain stacks, gain additional stacks.",
    icon: "sf:square.stack.3d.up.fill",
    members: ["Quest Steel Your Heart", "Upgrade Hubris", "Soul Eater", "Phenomenal Evil", "Master of Duality", "Tap Dancer", "Infinite Recursion"],
  },
  {
    id: "wee-woo",
    ko: "삐뽀삐뽀",
    en: "Wee Woo Wee Woo",
    dko: "체력 50% 이하의 아군에게 추가 지원 효과를 제공합니다.",
    den: "Gain bonus effects toward allies below 50% health.",
    icon: "sf:cross.case.fill",
    members: ["First-Aid Kit", "All For You", "Critical Healing", "Sonata", "Windspeakers Blessing", "Im a Baby Kitty Where is Mama"],
  },
];

const out = defs.map((d) => ({
  id: d.id,
  name: { ko: d.ko, en: d.en },
  description: { ko: d.dko, en: d.den },
  augmentIds: d.members.map(id),
  minCount: 2,
  icon: d.icon,
}));

fs.writeFileSync(
  "src/features/augments/data/synergies.json",
  JSON.stringify(out, null, 2) + "\n",
);
console.log("Wrote", out.length, "sets");
