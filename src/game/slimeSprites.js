import simpleSlimeSprite from '../assets/slimes/common/simpleslime.png'
import mythicalDemonSlimeSprite from '../assets/slimes/mythical/mythicaldemonslime.png'
import mythicalKingSlimeSprite from '../assets/slimes/mythical/mythicalkingslime.png'
import mythicalWitchSlimeSprite from '../assets/slimes/mythical/mythicalwitchslime.png'
import rareBaseballSlimeSprite from '../assets/slimes/rare/rarebaseballslime.png'
import rareBeanieSlimeSprite from '../assets/slimes/rare/rarebeanieslime.png'
import rareFedoraSlimeSprite from '../assets/slimes/rare/rarefedoraslime.png'
import { SLIME_RARITIES } from '../services/slimyPalsDb'

export { simpleSlimeSprite }

export const slimeOverlaySprites = Object.freeze({
  [SLIME_RARITIES.RARE]: {
    baseball: rareBaseballSlimeSprite,
    beanie: rareBeanieSlimeSprite,
    fedora: rareFedoraSlimeSprite,
  },
  [SLIME_RARITIES.MYTHICAL]: {
    demon: mythicalDemonSlimeSprite,
    king: mythicalKingSlimeSprite,
    witch: mythicalWitchSlimeSprite,
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
