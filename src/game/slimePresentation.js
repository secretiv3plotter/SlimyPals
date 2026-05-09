import { slimeColorFilters } from './slimeSprites'
import { SLIME_LEVELS } from '../services/slimyPalsDb'
import {
  SLIME_FRAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_SCALE,
  SLIME_YARD_COLUMNS,
  SLIME_YARD_ROWS,
  TILE_SIZE,
} from './worldConstants'
import { getSlimePosition } from './worldLayout'

// Level-based scale multipliers for visual growth: baby (0.65x), teen (0.85x), adult (1x)
const LEVEL_SCALE_MULTIPLIERS = Object.freeze({
  [SLIME_LEVELS.BABY]: 0.65,
  [SLIME_LEVELS.TEEN]: 0.85,
  [SLIME_LEVELS.ADULT]: 1.0,
})

const LEVEL_FRAME_COUNTS = Object.freeze({
  [SLIME_LEVELS.BABY]: 4,
  [SLIME_LEVELS.TEEN]: 4,
  [SLIME_LEVELS.ADULT]: 5,
})

export function getSlimeLevelScale(level = SLIME_LEVELS.ADULT) {
  return LEVEL_SCALE_MULTIPLIERS[level] ?? LEVEL_SCALE_MULTIPLIERS[SLIME_LEVELS.ADULT]
}

export function getSlimeFrameCount(level = SLIME_LEVELS.ADULT) {
  return LEVEL_FRAME_COUNTS[level] ?? LEVEL_FRAME_COUNTS[SLIME_LEVELS.ADULT]
}

export function getSlimeShadowEffect(level = SLIME_LEVELS.ADULT) {
  const levelScale = getSlimeLevelScale(level)
  // Shadow scales with the slime and slightly intensifies as slime grows
  const shadowBlur = Math.round(2 + levelScale * 1.5)
  const shadowOpacity = 0.24 + levelScale * 0.14
  return `drop-shadow(0 ${shadowBlur}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity.toFixed(2)}))`
}

export function getSlimeMotionPath(slime, index) {
  const levelScale = getSlimeLevelScale(slime.level)
  const random = createSeededRandom(getStringSeed(slime.id))
  const scaledWidth = SLIME_FRAME_WIDTH * SLIME_SCALE * levelScale
  const scaledHeight = SLIME_FRAME_HEIGHT * SLIME_SCALE * levelScale
  const maxX = Math.max(0, SLIME_YARD_COLUMNS * TILE_SIZE - scaledWidth)
  const maxY = Math.max(0, SLIME_YARD_ROWS * TILE_SIZE - scaledHeight)
  const start = getSlimePosition(index)
  const points = [
    start,
    { x: random() * maxX, y: random() * maxY },
    { x: random() * maxX, y: random() * maxY },
    { x: random() * maxX, y: random() * maxY },
  ]
  const faces = points.map((point, pointIndex) => {
    const nextPoint = points[(pointIndex + 1) % points.length]

    return nextPoint.x > point.x ? -1 : 1
  })

  return { faces, points }
}

export function getSlimeColorFilter(color) {
  return slimeColorFilters[color?.toLowerCase()] || slimeColorFilters['#58b56b']
}

function createSeededRandom(seed) {
  let value = seed || 1

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function getStringSeed(value) {
  return String(value).split('').reduce((seed, character) => {
    return (seed * 31 + character.charCodeAt(0)) >>> 0
  }, 2166136261)
}
