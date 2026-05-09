export const PLAYABLE_ROWS = 10
export const PLAYABLE_COLUMNS = 21
export const FENCE_ROWS = 6
export const FENCE_COLUMNS = 13
export const TILE_SIZE = 16
export const SLIME_YARD_COLUMN_START = 1
export const SLIME_YARD_ROW_START = 1
export const SLIME_YARD_COLUMNS = FENCE_COLUMNS - 2
export const SLIME_YARD_ROWS = FENCE_ROWS - 1
export const FOOD_FACTORY_COLUMNS_FROM_FENCE = -0.5
export const FOOD_FACTORY_FRAME_COUNT = 29
export const FOOD_FACTORY_FRAME_HEIGHT = 80
export const FOOD_FACTORY_FRAME_WIDTH = 80
export const FOOD_FACTORY_SCALE = 1
export const FOOD_OVERLAY_HEIGHT = TILE_SIZE
export const FOOD_OVERLAY_WIDTH = TILE_SIZE
export const OFFLINE_MVP_USERNAME = 'offline-mvp'
export const SLIME_FRAME_HEIGHT = 46
export const SLIME_FRAME_WIDTH = 68
export const SLIME_SCALE = 0.72
export const SUMMONING_GROUND_COLUMNS_FROM_FENCE = -0.2
export const SUMMONING_GROUND_FRAME_COUNT = 24
export const SUMMONING_GROUND_FRAME_HEIGHT = 128
export const SUMMONING_GROUND_FRAME_WIDTH = 80
export const SUMMONING_GROUND_SCALE = 1
export const SUMMONING_ORB_FRAME_COUNT = 24
export const SUMMONING_ORB_FRAME_HEIGHT = 128
export const SUMMONING_ORB_FRAME_WIDTH = 80
export const SUMMONING_ORB_SCALE = 1
export const PLAYABLE_PIXEL_HEIGHT = PLAYABLE_ROWS * TILE_SIZE
export const PLAYABLE_PIXEL_WIDTH = PLAYABLE_COLUMNS * TILE_SIZE
export const FRIEND_SLOTS = 4

export const DEFAULT_VIEW = Object.freeze({
  columns: PLAYABLE_COLUMNS,
  displayHeight: PLAYABLE_PIXEL_HEIGHT,
  displayWidth: PLAYABLE_PIXEL_WIDTH,
  playableColumnStart: 0,
  playableRowStart: 0,
  rows: PLAYABLE_ROWS,
  scale: 1,
})

export const DEFAULT_VIEWPORT = Object.freeze({
  height: 0,
  width: 0,
})
