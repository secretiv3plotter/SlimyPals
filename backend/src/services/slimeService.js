const SLIME_RARITIES = {
  COMMON: 'Common',
  RARE: 'Rare',
  MYTHICAL: 'Mythical',
};

const SLIME_TYPES_BY_RARITY = {
  [SLIME_RARITIES.RARE]: ['baseball', 'beanie', 'fedora'],
  [SLIME_RARITIES.MYTHICAL]: ['demon', 'king', 'witch'],
};

const COMMON_SLIME_COLORS = [
  { name: 'red', hex: '#d94b4b' },
  { name: 'orange', hex: '#e48a3a' },
  { name: 'yellow', hex: '#e2c84a' },
  { name: 'green', hex: '#58b56b' },
  { name: 'blue', hex: '#4d8fd9' },
  { name: 'purple', hex: '#9661c7' },
  { name: 'pink', hex: '#d96aa4' },
];

const SUMMON_RARITY_TABLE = [
  { rarity: SLIME_RARITIES.COMMON, weight: 60 },
  { rarity: SLIME_RARITIES.RARE, weight: 35 },
  { rarity: SLIME_RARITIES.MYTHICAL, weight: 5 },
];

exports.generateRandomSlime = () => {
  const rarity = pickWeightedRarity();
  const slimeColor = pickRandom(COMMON_SLIME_COLORS);
  
  let type;
  if (rarity === SLIME_RARITIES.COMMON) {
    type = slimeColor.name;
  } else {
    const types = SLIME_TYPES_BY_RARITY[rarity];
    type = pickRandom(types);
  }

  return {
    rarity,
    type,
    color: slimeColor.hex,
    level: 1 // Baby
  };
};

function pickWeightedRarity() {
  const totalWeight = SUMMON_RARITY_TABLE.reduce((total, entry) => total + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of SUMMON_RARITY_TABLE) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.rarity;
    }
  }
  return SUMMON_RARITY_TABLE[SUMMON_RARITY_TABLE.length - 1].rarity;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}
