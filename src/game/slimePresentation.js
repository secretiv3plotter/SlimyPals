import { slimeColorFilters } from './slimeSprites'
import {
  SLIME_MOVEMENT_HEIGHT,
  SLIME_MOVEMENT_OFFSET_X,
  SLIME_MOVEMENT_OFFSET_Y,
  SLIME_MOVEMENT_WIDTH,
  SLIME_SCALE,
  SLIME_YARD_COLUMNS,
  SLIME_YARD_ROWS,
  TILE_SIZE,
} from './worldConstants'
import { getSlimePosition } from './worldLayout'

export function getSlimeMotionPath(slime, index) {
  const random = createSeededRandom(getStringSeed(slime.id))
  const maxX = Math.max(0, SLIME_YARD_COLUMNS * TILE_SIZE - SLIME_MOVEMENT_WIDTH * SLIME_SCALE)
  const maxY = Math.max(0, SLIME_YARD_ROWS * TILE_SIZE - SLIME_MOVEMENT_HEIGHT * SLIME_SCALE)
  const start = getSlimePosition(index)
  const points = [
    start,
    getSlimeSpritePositionFromMovementBox({
      x: random() * maxX,
      y: random() * maxY,
    }),
    getSlimeSpritePositionFromMovementBox({
      x: random() * maxX,
      y: random() * maxY,
    }),
    getSlimeSpritePositionFromMovementBox({
      x: random() * maxX,
      y: random() * maxY,
    }),
  ]
  const faces = points.map((point, pointIndex) => {
    const nextPoint = points[(pointIndex + 1) % points.length]

    return nextPoint.x > point.x ? -1 : 1
  })

  return { faces, points }
}

export function getSlimeMovementDepth(point) {
  return Math.round(
    point.y +
    (SLIME_MOVEMENT_OFFSET_Y + SLIME_MOVEMENT_HEIGHT) * SLIME_SCALE,
  )
}

export function getSlimeSpritePositionFromMovementBox(point) {
  return {
    x: point.x - SLIME_MOVEMENT_OFFSET_X * SLIME_SCALE,
    y: point.y - SLIME_MOVEMENT_OFFSET_Y * SLIME_SCALE,
  }
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
