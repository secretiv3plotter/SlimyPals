import {
  DEFAULT_VIEW,
  FENCE_COLUMNS,
  FENCE_ROWS,
  FOOD_FACTORY_COLUMNS_FROM_FENCE,
  FOOD_FACTORY_FRAME_HEIGHT,
  FOOD_FACTORY_FRAME_WIDTH,
  FOOD_FACTORY_SCALE,
  PLAYABLE_COLUMNS,
  PLAYABLE_PIXEL_HEIGHT,
  PLAYABLE_PIXEL_WIDTH,
  PLAYABLE_ROWS,
  SLIME_FRAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_SCALE,
  SLIME_YARD_COLUMN_START,
  SLIME_YARD_COLUMNS,
  SLIME_YARD_ROW_START,
  SLIME_YARD_ROWS,
  SUMMONING_GROUND_COLUMNS_FROM_FENCE,
  SUMMONING_GROUND_FRAME_HEIGHT,
  SUMMONING_GROUND_SCALE,
  TILE_SIZE,
} from './worldConstants'

const DEFAULT_WORLD_ZOOM = 0.7

export function getMaximizedWorldView({ height, width }) {
  if (height <= 0 || width <= 0) {
    return DEFAULT_VIEW
  }

  const scale = (height / PLAYABLE_PIXEL_HEIGHT) * DEFAULT_WORLD_ZOOM
  const tileViewSize = TILE_SIZE * scale
  const paddingColumns = Math.ceil(width / tileViewSize)
  const paddingRows = Math.ceil(height / tileViewSize)
  const columns = PLAYABLE_COLUMNS + paddingColumns * 2
  const rows = PLAYABLE_ROWS + paddingRows * 2

  return {
    columns,
    displayHeight: rows * TILE_SIZE * scale,
    displayWidth: columns * TILE_SIZE * scale,
    playableColumnStart: paddingColumns,
    playableRowStart: paddingRows,
    rows,
    scale,
  }
}

export function getScreenViewSize() {
  const browserChromeHeight = Math.max(0, window.outerHeight - window.innerHeight)
  const browserChromeWidth = Math.max(0, window.outerWidth - window.innerWidth)

  return {
    height: Math.max(
      window.innerHeight,
      (window.screen?.availHeight || window.innerHeight) - browserChromeHeight,
    ),
    width: Math.max(
      window.innerWidth,
      (window.screen?.availWidth || window.innerWidth) - browserChromeWidth,
    ),
  }
}

export function clampOffset(offset, viewportSize, worldView) {
  return {
    x: clampAxis(offset.x, viewportSize.width, worldView.displayWidth),
    y: clampAxis(offset.y, viewportSize.height, worldView.displayHeight),
  }
}

export function getCenteredOffset(viewportSize, worldView) {
  const playableCenterX =
    (worldView.playableColumnStart * TILE_SIZE + PLAYABLE_PIXEL_WIDTH / 2) *
    worldView.scale
  const playableCenterY =
    (worldView.playableRowStart * TILE_SIZE + PLAYABLE_PIXEL_HEIGHT / 2) *
    worldView.scale

  return clampOffset(
    {
      x: viewportSize.width / 2 - playableCenterX,
      y: viewportSize.height / 2 - playableCenterY,
    },
    viewportSize,
    worldView,
  )
}

export function getFencePosition(worldView) {
  return {
    x:
      (worldView.playableColumnStart +
        (PLAYABLE_COLUMNS - FENCE_COLUMNS) / 2) *
      TILE_SIZE,
    y:
      (worldView.playableRowStart + (PLAYABLE_ROWS - FENCE_ROWS) / 2) *
      TILE_SIZE,
  }
}

export function getSummoningGroundPosition(fencePosition) {
  const summoningGroundHeight =
    SUMMONING_GROUND_FRAME_HEIGHT * SUMMONING_GROUND_SCALE

  return {
    x:
      fencePosition.x +
      (FENCE_COLUMNS + SUMMONING_GROUND_COLUMNS_FROM_FENCE) * TILE_SIZE,
    y:
      fencePosition.y +
      (3 * TILE_SIZE - summoningGroundHeight) / 2,
  }
}

export function getFoodFactoryPosition(fencePosition) {
  const foodFactoryHeight = FOOD_FACTORY_FRAME_HEIGHT * FOOD_FACTORY_SCALE
  const foodFactoryWidth = FOOD_FACTORY_FRAME_WIDTH * FOOD_FACTORY_SCALE

  return {
    x:
      fencePosition.x -
      FOOD_FACTORY_COLUMNS_FROM_FENCE * TILE_SIZE -
      foodFactoryWidth,
    y:
      fencePosition.y +
      (7.4 * TILE_SIZE - foodFactoryHeight) / 2,
  }
}

export function getFoodOverlayPosition(fencePosition) {
  return {
    x: fencePosition.x - TILE_SIZE * 2,
    y: fencePosition.y + TILE_SIZE * 2.7,
  }
}

export function getSlimeYardPosition(fencePosition) {
  return {
    x: fencePosition.x + SLIME_YARD_COLUMN_START * TILE_SIZE,
    y: fencePosition.y + SLIME_YARD_ROW_START * TILE_SIZE,
  }
}

export function getSlimePosition(index) {
  const columns = 5
  const xGap = (SLIME_YARD_COLUMNS * TILE_SIZE - SLIME_FRAME_WIDTH * SLIME_SCALE) /
    (columns - 1)
  const yGap = 14
  const row = Math.floor(index / columns)
  const column = index % columns
  const rowOffset = row % 2 === 0 ? 0 : xGap / 2

  return {
    x: Math.min(
      SLIME_YARD_COLUMNS * TILE_SIZE - SLIME_FRAME_WIDTH * SLIME_SCALE,
      column * xGap + rowOffset,
    ),
    y: Math.min(
      SLIME_YARD_ROWS * TILE_SIZE - SLIME_FRAME_HEIGHT * SLIME_SCALE,
      row * yGap,
    ),
  }
}

function clampAxis(value, viewportSize, worldSize) {
  if (worldSize <= viewportSize) {
    return (viewportSize - worldSize) / 2
  }

  return Math.min(0, Math.max(viewportSize - worldSize, value))
}
