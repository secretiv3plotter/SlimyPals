import {
  SLIME_MOVEMENT_HEIGHT,
  SLIME_MOVEMENT_OFFSET_X,
  SLIME_MOVEMENT_OFFSET_Y,
  SLIME_MOVEMENT_WIDTH,
} from '../layout/worldConstants'
import { SLIME_LEVELS } from '../../../infrastructure/db'

export const SLIME_DEATH_FRAME_COUNT = 6
export const SLIME_DEATH_FRAME_ASPECT_RATIO = 47 / 44

export const SLIME_WANDER_SPEED_SECONDS_BY_LEVEL = Object.freeze({
  [SLIME_LEVELS.BABY]: 56,
  [SLIME_LEVELS.TEEN]: 38,
  [SLIME_LEVELS.ADULT]: 28,
})

export const SLIME_HITBOXES_BY_LEVEL = Object.freeze({
  [SLIME_LEVELS.BABY]: {
    height: 10,
    offsetX: 8,
    offsetY: 25,
    width: 11,
  },
  [SLIME_LEVELS.TEEN]: {
    height: 12,
    offsetX: 6,
    offsetY: 24,
    width: 15,
  },
  [SLIME_LEVELS.ADULT]: {
    height: SLIME_MOVEMENT_HEIGHT - 4,
    offsetX: SLIME_MOVEMENT_OFFSET_X + 1,
    offsetY: SLIME_MOVEMENT_OFFSET_Y + 6,
    width: SLIME_MOVEMENT_WIDTH - 6,
  },
})
