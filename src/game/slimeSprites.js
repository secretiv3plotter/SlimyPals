import adultSlimeSprite from '../assets/slimes/adult/adultslime.png'
import adultSlimeShadowSprite from '../assets/slimes/adult/adultslimeshadow.png'
import mythicalAdultDemonSlimeSprite from '../assets/slimes/adult/mythical/mythicaladultdemon.png'
import mythicalAdultDemonShadowSprite from '../assets/slimes/adult/mythical/demonadultshadow.png'
import mythicalAdultKingSlimeSprite from '../assets/slimes/adult/mythical/mythicaladultking.png'
import mythicalAdultKingShadowSprite from '../assets/slimes/adult/mythical/kingadultshadow.png'
import mythicalAdultWitchSlimeSprite from '../assets/slimes/adult/mythical/mythicaladultwitch.png'
import mythicalAdultWitchShadowSprite from '../assets/slimes/adult/mythical/witchadultshadow.png'
import rareAdultBaseballSlimeSprite from '../assets/slimes/adult/rare/rareadultbaseball.png'
import rareAdultBaseballShadowSprite from '../assets/slimes/adult/rare/baseballadultshadow.png'
import rareAdultBeanieSlimeSprite from '../assets/slimes/adult/rare/rareadultbeanie.png'
import rareAdultBeanieShadowSprite from '../assets/slimes/adult/rare/beanieadultshadow.png'
import rareAdultFedoraSlimeSprite from '../assets/slimes/adult/rare/rareadultfedora.png'
import rareAdultFedoraShadowSprite from '../assets/slimes/adult/rare/fedoraadultshadow.png'
import babySlimeSprite from '../assets/slimes/baby/babyslime.png'
import babySlimeShadowSprite from '../assets/slimes/baby/babyslimeshadow.png'
import mythicalBabyDemonSlimeSprite from '../assets/slimes/baby/mythical/mythicalbabydemon.png'
import mythicalBabyDemonShadowSprite from '../assets/slimes/baby/mythical/demonbabyshadow.png'
import mythicalBabyKingSlimeSprite from '../assets/slimes/baby/mythical/mythicalbabyking.png'
import mythicalBabyKingShadowSprite from '../assets/slimes/baby/mythical/kingbabyshadow.png'
import mythicalBabyWitchSlimeSprite from '../assets/slimes/baby/mythical/mythicalbabywitch.png'
import mythicalBabyWitchShadowSprite from '../assets/slimes/baby/mythical/witchbabyshadow.png'
import rareBabyBaseballSlimeSprite from '../assets/slimes/baby/rare/rarebabybaseball.png'
import rareBabyBaseballShadowSprite from '../assets/slimes/baby/rare/baseballbabyshadow.png'
import rareBabyBeanieSlimeSprite from '../assets/slimes/baby/rare/rarebabybeanie.png'
import rareBabyBeanieShadowSprite from '../assets/slimes/baby/rare/beaniebabyshadow.png'
import rareBabyFedoraSlimeSprite from '../assets/slimes/baby/rare/rarebabyfedora.png'
import rareBabyFedoraShadowSprite from '../assets/slimes/baby/rare/fedorababyshadow.png'
import teenSlimeSprite from '../assets/slimes/teen/teenslime.png'
import teenSlimeShadowSprite from '../assets/slimes/teen/teenslimeshadow.png'
import mythicalTeenDemonSlimeSprite from '../assets/slimes/teen/mythical/mythicalteendemon.png'
import mythicalTeenDemonShadowSprite from '../assets/slimes/teen/mythical/demonteenshadow.png'
import mythicalTeenKingSlimeSprite from '../assets/slimes/teen/mythical/mythicalteenking.png'
import mythicalTeenKingShadowSprite from '../assets/slimes/teen/mythical/kingteenshadow.png'
import mythicalTeenWitchSlimeSprite from '../assets/slimes/teen/mythical/mythicalteenwitch.png'
import mythicalTeenWitchShadowSprite from '../assets/slimes/teen/mythical/witchteenshadow.png'
import rareTeenBaseballSlimeSprite from '../assets/slimes/teen/rare/rareteenbaseball.png'
import rareTeenBaseballShadowSprite from '../assets/slimes/teen/rare/baseballteenshadow.png'
import rareTeenBeanieSlimeSprite from '../assets/slimes/teen/rare/rareteenbeanie.png'
import rareTeenBeanieShadowSprite from '../assets/slimes/teen/rare/beanieteenshadow.png'
import rareTeenFedoraSlimeSprite from '../assets/slimes/teen/rare/rareteenfedora.png'
import rareTeenFedoraShadowSprite from '../assets/slimes/teen/rare/fedorateenshadow.png'
import { SLIME_LEVELS, SLIME_RARITIES } from '../services/slimyPalsDb'

export const slimeBaseSprites = Object.freeze({
  [SLIME_LEVELS.BABY]: babySlimeSprite,
  [SLIME_LEVELS.TEEN]: teenSlimeSprite,
  [SLIME_LEVELS.ADULT]: adultSlimeSprite,
})

export const slimeShadowSprites = Object.freeze({
  [SLIME_LEVELS.BABY]: babySlimeShadowSprite,
  [SLIME_LEVELS.TEEN]: teenSlimeShadowSprite,
  [SLIME_LEVELS.ADULT]: adultSlimeShadowSprite,
})

export const slimeOverlaySprites = Object.freeze({
  [SLIME_LEVELS.BABY]: {
    [SLIME_RARITIES.RARE]: {
      baseball: rareBabyBaseballSlimeSprite,
      beanie: rareBabyBeanieSlimeSprite,
      fedora: rareBabyFedoraSlimeSprite,
    },
    [SLIME_RARITIES.MYTHICAL]: {
      demon: mythicalBabyDemonSlimeSprite,
      king: mythicalBabyKingSlimeSprite,
      witch: mythicalBabyWitchSlimeSprite,
    },
  },
  [SLIME_LEVELS.TEEN]: {
    [SLIME_RARITIES.RARE]: {
      baseball: rareTeenBaseballSlimeSprite,
      beanie: rareTeenBeanieSlimeSprite,
      fedora: rareTeenFedoraSlimeSprite,
    },
    [SLIME_RARITIES.MYTHICAL]: {
      demon: mythicalTeenDemonSlimeSprite,
      king: mythicalTeenKingSlimeSprite,
      witch: mythicalTeenWitchSlimeSprite,
    },
  },
  [SLIME_LEVELS.ADULT]: {
    [SLIME_RARITIES.RARE]: {
      baseball: rareAdultBaseballSlimeSprite,
      beanie: rareAdultBeanieSlimeSprite,
      fedora: rareAdultFedoraSlimeSprite,
    },
    [SLIME_RARITIES.MYTHICAL]: {
      demon: mythicalAdultDemonSlimeSprite,
      king: mythicalAdultKingSlimeSprite,
      witch: mythicalAdultWitchSlimeSprite,
    },
  },
})

export const slimeOverlayShadowSprites = Object.freeze({
  [SLIME_LEVELS.BABY]: {
    [SLIME_RARITIES.RARE]: {
      baseball: rareBabyBaseballShadowSprite,
      beanie: rareBabyBeanieShadowSprite,
      fedora: rareBabyFedoraShadowSprite,
    },
    [SLIME_RARITIES.MYTHICAL]: {
      demon: mythicalBabyDemonShadowSprite,
      king: mythicalBabyKingShadowSprite,
      witch: mythicalBabyWitchShadowSprite,
    },
  },
  [SLIME_LEVELS.TEEN]: {
    [SLIME_RARITIES.RARE]: {
      baseball: rareTeenBaseballShadowSprite,
      beanie: rareTeenBeanieShadowSprite,
      fedora: rareTeenFedoraShadowSprite,
    },
    [SLIME_RARITIES.MYTHICAL]: {
      demon: mythicalTeenDemonShadowSprite,
      king: mythicalTeenKingShadowSprite,
      witch: mythicalTeenWitchShadowSprite,
    },
  },
  [SLIME_LEVELS.ADULT]: {
    [SLIME_RARITIES.RARE]: {
      baseball: rareAdultBaseballShadowSprite,
      beanie: rareAdultBeanieShadowSprite,
      fedora: rareAdultFedoraShadowSprite,
    },
    [SLIME_RARITIES.MYTHICAL]: {
      demon: mythicalAdultDemonShadowSprite,
      king: mythicalAdultKingShadowSprite,
      witch: mythicalAdultWitchShadowSprite,
    },
  },
})

export function getSlimeBaseSprite(level) {
  return slimeBaseSprites[level] ?? slimeBaseSprites[SLIME_LEVELS.ADULT]
}

export function getSlimeShadowSprite(level) {
  return slimeShadowSprites[level] ?? slimeShadowSprites[SLIME_LEVELS.ADULT]
}

export function getSlimeOverlaySprite(slime) {
  const levelSprites = slimeOverlaySprites[slime.level] ?? slimeOverlaySprites[SLIME_LEVELS.ADULT]

  return levelSprites?.[slime.rarity]?.[slime.type]
}

export function getSlimeOverlayShadowSprite(slime) {
  const levelSprites = slimeOverlayShadowSprites[slime.level] ??
    slimeOverlayShadowSprites[SLIME_LEVELS.ADULT]

  return levelSprites?.[slime.rarity]?.[slime.type]
}

export const slimeColorFilters = Object.freeze({
  '#d94b4b': 'sepia(1) saturate(2.1) hue-rotate(310deg) brightness(0.94)',
  '#e48a3a': 'sepia(1) saturate(2.2) hue-rotate(350deg) brightness(1.02)',
  '#e2c84a': 'sepia(1) saturate(2.6) hue-rotate(12deg) brightness(1.08)',
  '#58b56b': 'sepia(1) saturate(1.8) hue-rotate(70deg) brightness(0.95)',
  '#4d8fd9': 'sepia(1) saturate(2.4) hue-rotate(165deg) brightness(0.96)',
  '#9661c7': 'sepia(1) saturate(2.1) hue-rotate(225deg) brightness(0.95)',
  '#d96aa4': 'sepia(1) saturate(2.1) hue-rotate(275deg) brightness(1.02)',
})
