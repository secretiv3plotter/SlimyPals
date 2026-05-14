import fenceColumnTile from '../assets/map/fence/fencecolumn.png'
import fenceRowTile from '../assets/map/fence/fencerow.png'
import {
  FENCE_COLUMNS,
  FENCE_ROWS,
  TILE_SIZE,
} from './worldConstants'

const mapTiles = Object.entries(
  import.meta.glob('../assets/map/tiles/map*.png', {
    eager: true,
    import: 'default',
  }),
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, tile]) => tile)

export function createTileGrid({ columns, rows }) {
  return Array.from({ length: rows * columns }, (_, index) => {
    const x = index % columns
    const y = Math.floor(index / columns)

    return {
      id: `${x}-${y}`,
      src: getMapTile(x, y, index),
    }
  })
}

export function createFenceTiles() {
  return Array.from({ length: FENCE_ROWS * FENCE_COLUMNS }, (_, index) => {
    const x = index % FENCE_COLUMNS
    const y = Math.floor(index / FENCE_COLUMNS)
    const isTopOrBottom = y === 0 || y === FENCE_ROWS - 1
    const isLeftColumn = x === 0 && !isTopOrBottom
    const isRightColumn = x === FENCE_COLUMNS - 1 && !isTopOrBottom
    const hasBottomColumnOverlay =
      y === FENCE_ROWS - 1 && (x === 0 || x === FENCE_COLUMNS - 1)
    const layers = []

    if (isTopOrBottom) {
      layers.push({ id: 'row', src: fenceRowTile })
    }

    if (isLeftColumn || isRightColumn || hasBottomColumnOverlay) {
      layers.push({
        id: 'column',
        isRightColumn: x === FENCE_COLUMNS - 1,
        src: fenceColumnTile,
      })
    }

    return {
      id: `fence-${x}-${y}`,
      layers,
      x,
      y,
    }
  })
}

function getMapTile(x, y, index) {
  const tileIndex =
    index < mapTiles.length
      ? index
      : Math.floor(
          Math.abs(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453),
        ) % mapTiles.length

  return mapTiles[tileIndex]
}

export function getGridSizeStyle({ columns, rows }) {
  return {
    gridTemplateColumns: `repeat(${columns}, ${TILE_SIZE}px)`,
    gridTemplateRows: `repeat(${rows}, ${TILE_SIZE}px)`,
  }
}
