import loopBackground from '../assets/soundeffects/LOOP_BACKGROUND.mp3'
import click from '../assets/soundeffects/click.MP3'
import eating from '../assets/soundeffects/eating.mp3'
import factory from '../assets/soundeffects/factory.mp3'
import kill from '../assets/soundeffects/kill.mp3'
import levelUp from '../assets/soundeffects/levelup.mp3'
import mythicalDemon from '../assets/soundeffects/mythicalslime/Demon.mp3'
import mythicalKing from '../assets/soundeffects/mythicalslime/king.mp3'
import mythicalWitch from '../assets/soundeffects/mythicalslime/witch.mp3'
import rareBaseball from '../assets/soundeffects/rareslime/baseball.mp3'
import rareBeanie from '../assets/soundeffects/rareslime/beanie.mp3'
import rareFedora from '../assets/soundeffects/rareslime/fedora.mp3'
import summon1 from '../assets/soundeffects/summon/summon1.mp3'
import summon2 from '../assets/soundeffects/summon/summon2.mp3'

export const SOUND_KEYS = {
  BGM_LOOP: 'BGM_LOOP',
  CLICK: 'CLICK',
  EATING: 'EATING',
  FACTORY: 'FACTORY',
  KILL: 'KILL',
  LEVEL_UP: 'LEVEL_UP',
  MYTHICAL_DEMON: 'MYTHICAL_DEMON',
  MYTHICAL_KING: 'MYTHICAL_KING',
  MYTHICAL_WITCH: 'MYTHICAL_WITCH',
  RARE_BASEBALL: 'RARE_BASEBALL',
  RARE_BEANIE: 'RARE_BEANIE',
  RARE_FEDORA: 'RARE_FEDORA',
  SUMMON_1: 'SUMMON_1',
  SUMMON_2: 'SUMMON_2',
}

export const SOUND_FILES = {
  [SOUND_KEYS.BGM_LOOP]: loopBackground,
  [SOUND_KEYS.CLICK]: click,
  [SOUND_KEYS.EATING]: eating,
  [SOUND_KEYS.FACTORY]: factory,
  [SOUND_KEYS.KILL]: kill,
  [SOUND_KEYS.LEVEL_UP]: levelUp,
  [SOUND_KEYS.MYTHICAL_DEMON]: mythicalDemon,
  [SOUND_KEYS.MYTHICAL_KING]: mythicalKing,
  [SOUND_KEYS.MYTHICAL_WITCH]: mythicalWitch,
  [SOUND_KEYS.RARE_BASEBALL]: rareBaseball,
  [SOUND_KEYS.RARE_BEANIE]: rareBeanie,
  [SOUND_KEYS.RARE_FEDORA]: rareFedora,
  [SOUND_KEYS.SUMMON_1]: summon1,
  [SOUND_KEYS.SUMMON_2]: summon2,
}
