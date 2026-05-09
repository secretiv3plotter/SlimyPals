// Slimes
import slimeShadowBaby from '../assets/slimes/Slime_Shadow_Baby.png'
import slimeShadowTeen from '../assets/slimes/Slime_Shadow_Teen.png'
import slimeShadowAdult from '../assets/slimes/Slime_Shadow_Adult.png'
import slimeBaby from '../assets/slimes/Slime_Baby.png'
import slimeTeenSprite from '../assets/slimes/Slime_Teen.png'
import slimeAdultSprite from '../assets/slimes/Slime_Adult.png'

// Rare slimes - Baseball
import rareBaseballBaby from '../assets/slimes/rare/Baseball_Baby.png'
import rareBaseballTeenSprite from '../assets/slimes/rare/Baseball_Teen.png'
import rareBaseballAdult from '../assets/slimes/rare/Baseball_Adult.png'
import rareBaseballAdultShadow from '../assets/slimes/rare/Baseball_Shadow_Adult.png'
import rareBaseballTeenShadow from '../assets/slimes/rare/Baseball_Shadow_Teen.png'
import rareBaseballBabyShadow from '../assets/slimes/rare/Baseball_Shadow_Baby.png'

// Rare slimes - Beanie
import rareBeanieHatBaby from '../assets/slimes/rare/BeanieHat_Baby.png'
import rareBeanieHatTeenSprite from '../assets/slimes/rare/BeanieHat_Teen.png'
import rareBeanieHatAdult from '../assets/slimes/rare/BeanieHat_Adult.png'
import rareBeanieHatAdultShadow from '../assets/slimes/rare/Beanie_Shadow_Adult.png'
import rareBeanieHatTeenShadow from '../assets/slimes/rare/Beanie_Shadow_Teen.png'
import rareBeanieHatBabyShadow from '../assets/slimes/rare/Beanie_Shadow_Baby.png'

// Rare slimes - Fedora
import rareFedoraHatBaby from '../assets/slimes/rare/FedoraHat_Baby.png'
import rareFedoraHatTeenSprite from '../assets/slimes/rare/FedoraHat_Teen.png'
import rareFedoraHatAdult from '../assets/slimes/rare/FedoraHat_Adult.png'
import rareFedoraHatAdultShadow from '../assets/slimes/rare/Fedora_Shadow_Adult.png'
import rareFedoraHatTeenShadow from '../assets/slimes/rare/Fedora_Shadow_Teen.png'
import rareFedoraHatBabyShadow from '../assets/slimes/rare/Fedora_Shadow_Baby.png'

// Mythical slimes - Demon
import mythicalDemonHatBaby from '../assets/slimes/mythical/DemonHat_Baby.png'
import mythicalDemonHatTeenSprite from '../assets/slimes/mythical/DemonHat_Teen.png'
import mythicalDemonHatAdult from '../assets/slimes/mythical/DemonHat_Adult.png'
import mythicalDemonHatAdultShadow from '../assets/slimes/mythical/DemonHat_Shadow_Adult.png'
import mythicalDemonHatTeenShadow from '../assets/slimes/mythical/DemonHat_Shadow_Teen.png'
import mythicalDemonHatBabyShadow from '../assets/slimes/mythical/DemonHat_Shadow_Baby.png'

// Mythical slimes - King
import mythicalKingHatBaby from '../assets/slimes/mythical/KingtHat_Baby.png'
import mythicalKingHatTeenSprite from '../assets/slimes/mythical/KingtHat_Teen.png'
import mythicalKingHatAdult from '../assets/slimes/mythical/KingtHat_Adult.png'
import mythicalKingHatAdultShadow from '../assets/slimes/mythical/King_Shadow_Adult.png'
import mythicalKingHatTeenShadow from '../assets/slimes/mythical/King_Shadow_Teen.png'
import mythicalKingHatBabyShadow from '../assets/slimes/mythical/King_Shadow_Baby.png'

// Mythical slimes - Witch
import mythicalWitchHatBaby from '../assets/slimes/mythical/WitchHat_Baby.png'
import mythicalWitchHatTeenSprite from '../assets/slimes/mythical/WitchHat_Teen.png'
import mythicalWitchHatAdult from '../assets/slimes/mythical/WitchHat_Adult.png'
import mythicalWitchHatAdultShadow from '../assets/slimes/mythical/Witch_Shadow_Adult.png'
import mythicalWitchHatTeenShadow from '../assets/slimes/mythical/Witch_Shadow_Teen.png'
import mythicalWitchHatBabyShadow from '../assets/slimes/mythical/Witch_Shadow_Baby.png'

import { SLIME_LEVELS, SLIME_RARITIES } from '../services/slimyPalsDb'

const baseSpritesByLevel = Object.freeze({
  [SLIME_LEVELS.BABY]: slimeBaby,
  [SLIME_LEVELS.TEEN]: slimeTeenSprite,
  [SLIME_LEVELS.ADULT]: slimeAdultSprite,
})

const shadowSpritesByLevel = Object.freeze({
  [SLIME_LEVELS.BABY]: slimeShadowBaby,
  [SLIME_LEVELS.TEEN]: slimeShadowTeen,
  [SLIME_LEVELS.ADULT]: slimeShadowAdult,
})

// Level-specific overlays for each rarity and type
const overlaysByRarityAndType = Object.freeze({
  [SLIME_RARITIES.RARE]: {
    baseball: {
      [SLIME_LEVELS.BABY]: rareBaseballBaby,
      [SLIME_LEVELS.TEEN]: rareBaseballTeenSprite,
      [SLIME_LEVELS.ADULT]: rareBaseballAdult,
    },
    beanie: {
      [SLIME_LEVELS.BABY]: rareBeanieHatBaby,
      [SLIME_LEVELS.TEEN]: rareBeanieHatTeenSprite,
      [SLIME_LEVELS.ADULT]: rareBeanieHatAdult,
    },
    fedora: {
      [SLIME_LEVELS.BABY]: rareFedoraHatBaby,
      [SLIME_LEVELS.TEEN]: rareFedoraHatTeenSprite,
      [SLIME_LEVELS.ADULT]: rareFedoraHatAdult,
    },
  },
  [SLIME_RARITIES.MYTHICAL]: {
    demon: {
      [SLIME_LEVELS.BABY]: mythicalDemonHatBaby,
      [SLIME_LEVELS.TEEN]: mythicalDemonHatTeenSprite,
      [SLIME_LEVELS.ADULT]: mythicalDemonHatAdult,
    },
    king: {
      [SLIME_LEVELS.BABY]: mythicalKingHatBaby,
      [SLIME_LEVELS.TEEN]: mythicalKingHatTeenSprite,
      [SLIME_LEVELS.ADULT]: mythicalKingHatAdult,
    },
    witch: {
      [SLIME_LEVELS.BABY]: mythicalWitchHatBaby,
      [SLIME_LEVELS.TEEN]: mythicalWitchHatTeenSprite,
      [SLIME_LEVELS.ADULT]: mythicalWitchHatAdult,
    },
  },
})

const overlayShadowsByRarityAndType = Object.freeze({
  [SLIME_RARITIES.RARE]: {
    baseball: {
      [SLIME_LEVELS.BABY]: rareBaseballBabyShadow,
      [SLIME_LEVELS.TEEN]: rareBaseballTeenShadow,
      [SLIME_LEVELS.ADULT]: rareBaseballAdultShadow,
    },
    beanie: {
      [SLIME_LEVELS.BABY]: rareBeanieHatBabyShadow,
      [SLIME_LEVELS.TEEN]: rareBeanieHatTeenShadow,
      [SLIME_LEVELS.ADULT]: rareBeanieHatAdultShadow,
    },
    fedora: {
      [SLIME_LEVELS.BABY]: rareFedoraHatBabyShadow,
      [SLIME_LEVELS.TEEN]: rareFedoraHatTeenShadow,
      [SLIME_LEVELS.ADULT]: rareFedoraHatAdultShadow,
    },
  },
  [SLIME_RARITIES.MYTHICAL]: {
    demon: {
      [SLIME_LEVELS.BABY]: mythicalDemonHatBabyShadow,
      [SLIME_LEVELS.TEEN]: mythicalDemonHatTeenShadow,
      [SLIME_LEVELS.ADULT]: mythicalDemonHatAdultShadow,
    },
    king: {
      [SLIME_LEVELS.BABY]: mythicalKingHatBabyShadow,
      [SLIME_LEVELS.TEEN]: mythicalKingHatTeenShadow,
      [SLIME_LEVELS.ADULT]: mythicalKingHatAdultShadow,
    },
    witch: {
      [SLIME_LEVELS.BABY]: mythicalWitchHatBabyShadow,
      [SLIME_LEVELS.TEEN]: mythicalWitchHatTeenShadow,
      [SLIME_LEVELS.ADULT]: mythicalWitchHatAdultShadow,
    },
  },
})

export function getSlimeBaseSprite(level = SLIME_LEVELS.ADULT) {
  return baseSpritesByLevel[Number(level)] ?? baseSpritesByLevel[SLIME_LEVELS.ADULT]
}

export function getSlimeShadowSprite(level = SLIME_LEVELS.ADULT) {
  return shadowSpritesByLevel[Number(level)] ?? shadowSpritesByLevel[SLIME_LEVELS.ADULT]
}

export function getSlimeOverlaySprite(rarity, type, level = SLIME_LEVELS.ADULT) {
  return overlaysByRarityAndType[rarity]?.[type]?.[Number(level)] ?? null
}

export function getSlimeOverlayShadowSprite(rarity, type, level = SLIME_LEVELS.ADULT) {
  return overlayShadowsByRarityAndType[rarity]?.[type]?.[Number(level)] ?? null
}

// Maintain backwards compatibility for existing code
export const slimeOverlaySprites = Object.freeze({
  [SLIME_RARITIES.RARE]: {
    baseball: rareBaseballBaby,
    beanie: rareBeanieHatBaby,
    fedora: rareFedoraHatBaby,
  },
  [SLIME_RARITIES.MYTHICAL]: {
    demon: mythicalDemonHatBaby,
    king: mythicalKingHatBaby,
    witch: mythicalWitchHatBaby,
  },
})

export const slimeColorFilters = Object.freeze({
  '#d94b4b': 'sepia(1) saturate(2.1) hue-rotate(310deg) brightness(0.94)',
  '#e48a3a': 'sepia(1) saturate(2.2) hue-rotate(350deg) brightness(1.02)',
  '#e2c84a': 'sepia(1) saturate(2.6) hue-rotate(12deg) brightness(1.08)',
  '#58b56b': 'sepia(1) saturate(1.8) hue-rotate(70deg) brightness(0.95)',
  '#4d8fd9': 'sepia(1) saturate(2.4) hue-rotate(165deg) brightness(0.96)',
  '#9661c7': 'sepia(1) saturate(2.1) hue-rotate(225deg) brightness(0.95)',
  '#d96aa4': 'sepia(1) saturate(2.1) hue-rotate(275deg) brightness(1.02)',
})
