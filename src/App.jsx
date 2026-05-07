import { useEffect, useMemo, useRef, useState } from 'react'
import simpleSlimeSprite from './assets/slimes/simpleslime.png'
import mythicalDemonSlimeSprite from './assets/slimes/mythical/mythicaldemonslime.png'
import mythicalKingSlimeSprite from './assets/slimes/mythical/mythicalkingslime.png'
import mythicalWitchSlimeSprite from './assets/slimes/mythical/mythicalwitchslime.png'
import rareBaseballSlimeSprite from './assets/slimes/rare/rarebaseballslime.png'
import rareBeanieSlimeSprite from './assets/slimes/rare/rarebeanieslime.png'
import rareFedoraSlimeSprite from './assets/slimes/rare/rarefedoraslime.png'
import fenceColumnTile from './assets/sprites/fencecolumn.png'
import foodSprite from './assets/sprites/food.png'
import foodFactorySprite from './assets/sprites/foodfactory.png'
import fenceRowTile from './assets/sprites/fencerow.png'
import menuButtonSprite from './assets/sprites/menu button.png'
import summoningGroundSprite from './assets/sprites/summoningground.png'
import summoningOrbSprite from './assets/sprites/summoningorb.png'
import { summonSlime } from './services/slimeManagement'
import {
  SLIME_RARITIES,
  openSlimyPalsDb,
  slimesRepository,
  usersRepository,
} from './services/slimyPalsDb'

const PLAYABLE_ROWS = 10
const PLAYABLE_COLUMNS = 21
const FENCE_ROWS = 6
const FENCE_COLUMNS = 13
const TILE_SIZE = 16
const SLIME_YARD_COLUMN_START = 1
const SLIME_YARD_ROW_START = 1
const SLIME_YARD_COLUMNS = FENCE_COLUMNS - 2
const SLIME_YARD_ROWS = FENCE_ROWS - 1
const FOOD_FACTORY_COLUMNS_FROM_FENCE = -0.5
const FOOD_FACTORY_FRAME_COUNT = 29
const FOOD_FACTORY_FRAME_HEIGHT = 115
const FOOD_FACTORY_FRAME_WIDTH = 64
const FOOD_FACTORY_SCALE = 1
const FOOD_OVERLAY_HEIGHT = TILE_SIZE
const FOOD_OVERLAY_WIDTH = TILE_SIZE
const OFFLINE_MVP_USERNAME = 'offline-mvp'
const SLIME_FRAME_HEIGHT = 46
const SLIME_FRAME_WIDTH = 68
const SLIME_SCALE = 0.72
const SUMMONING_GROUND_COLUMNS_FROM_FENCE = -0.2
const SUMMONING_GROUND_FRAME_COUNT = 20
const SUMMONING_GROUND_FRAME_HEIGHT = 113
const SUMMONING_GROUND_FRAME_WIDTH = 64
const SUMMONING_GROUND_SCALE = 1
const PLAYABLE_PIXEL_HEIGHT = PLAYABLE_ROWS * TILE_SIZE
const PLAYABLE_PIXEL_WIDTH = PLAYABLE_COLUMNS * TILE_SIZE
const FRIEND_SLOTS = 4
const slimeOverlaySprites = Object.freeze({
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
const slimeColorFilters = Object.freeze({
  '#d94b4b': 'sepia(1) saturate(2.1) hue-rotate(310deg) brightness(0.94)',
  '#e48a3a': 'sepia(1) saturate(2.2) hue-rotate(350deg) brightness(1.02)',
  '#e2c84a': 'sepia(1) saturate(2.6) hue-rotate(12deg) brightness(1.08)',
  '#58b56b': 'sepia(1) saturate(1.8) hue-rotate(70deg) brightness(0.95)',
  '#4d8fd9': 'sepia(1) saturate(2.4) hue-rotate(165deg) brightness(0.96)',
  '#9661c7': 'sepia(1) saturate(2.1) hue-rotate(225deg) brightness(0.95)',
  '#d96aa4': 'sepia(1) saturate(2.1) hue-rotate(275deg) brightness(1.02)',
})
const mapTiles = Object.entries(
  import.meta.glob('./assets/sprites/map*.png', {
    eager: true,
    import: 'default',
  }),
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, tile]) => tile)

function getMapTile(x, y, index) {
  const tileIndex =
    index < mapTiles.length
      ? index
      : Math.floor(
          Math.abs(Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453),
        ) % mapTiles.length

  return mapTiles[tileIndex]
}

function createTileGrid({ columns, rows }) {
  return Array.from({ length: rows * columns }, (_, index) => {
    const x = index % columns
    const y = Math.floor(index / columns)

    return {
      id: `${x}-${y}`,
      src: getMapTile(x, y, index),
    }
  })
}

function createFenceTiles() {
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
    }
  })
}

const DEFAULT_VIEW = Object.freeze({
  columns: PLAYABLE_COLUMNS,
  displayHeight: PLAYABLE_PIXEL_HEIGHT,
  displayWidth: PLAYABLE_PIXEL_WIDTH,
  playableColumnStart: 0,
  playableRowStart: 0,
  rows: PLAYABLE_ROWS,
  scale: 1,
})

const DEFAULT_VIEWPORT = Object.freeze({
  height: 0,
  width: 0,
})

function getMaximizedWorldView({ height, width }) {
  if (height <= 0 || width <= 0) {
    return DEFAULT_VIEW
  }

  const scale = height / PLAYABLE_PIXEL_HEIGHT
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

function getScreenViewSize() {
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

function clampOffset(offset, viewportSize, worldView) {
  return {
    x: clampAxis(offset.x, viewportSize.width, worldView.displayWidth),
    y: clampAxis(offset.y, viewportSize.height, worldView.displayHeight),
  }
}

function getCenteredOffset(viewportSize, worldView) {
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

function getFencePosition(worldView) {
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

function getSummoningGroundPosition(fencePosition) {
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

function getFoodFactoryPosition(fencePosition) {
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

function getFoodOverlayPosition(fencePosition) {
  return {
    x: fencePosition.x - TILE_SIZE * 2,
    y: fencePosition.y + TILE_SIZE * 2.7,
  }
}

function getSlimeYardPosition(fencePosition) {
  return {
    x: fencePosition.x + SLIME_YARD_COLUMN_START * TILE_SIZE,
    y: fencePosition.y + SLIME_YARD_ROW_START * TILE_SIZE,
  }
}

function getSlimePosition(index) {
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

function getSlimeMotionPath(slime, index) {
  const random = createSeededRandom(getStringSeed(slime.id))
  const maxX = Math.max(0, SLIME_YARD_COLUMNS * TILE_SIZE - SLIME_FRAME_WIDTH * SLIME_SCALE)
  const maxY = Math.max(0, SLIME_YARD_ROWS * TILE_SIZE - SLIME_FRAME_HEIGHT * SLIME_SCALE)
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

function getSlimeColorFilter(color) {
  return slimeColorFilters[color?.toLowerCase()] || slimeColorFilters['#58b56b']
}

async function getOrCreateOfflineUser() {
  await openSlimyPalsDb()

  const existingUser = await usersRepository.getByUsername(OFFLINE_MVP_USERNAME)

  if (existingUser && !existingUser.deleted_at) {
    return existingUser
  }

  try {
    return await usersRepository.create({
      username: OFFLINE_MVP_USERNAME,
      password_hash: 'offline-mvp',
      last_login: new Date().toISOString(),
    })
  } catch {
    return usersRepository.getByUsername(OFFLINE_MVP_USERNAME)
  }
}

function clampAxis(value, viewportSize, worldSize) {
  if (worldSize <= viewportSize) {
    return (viewportSize - worldSize) / 2
  }

  return Math.min(0, Math.max(viewportSize - worldSize, value))
}

function App() {
  const worldViewRef = useRef(null)
  const dragRef = useRef(null)
  const [worldView] = useState(() => getMaximizedWorldView(getScreenViewSize()))
  const [foodFactoryAnimationRun, setFoodFactoryAnimationRun] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuMode, setMenuMode] = useState('main')
  const [offlineUser, setOfflineUser] = useState(null)
  const [slimes, setSlimes] = useState([])
  const [summoningOrbAnimationRun, setSummoningOrbAnimationRun] = useState(0)
  const [viewportSize, setViewportSize] = useState(DEFAULT_VIEWPORT)
  const [offset, setOffset] = useState(null)
  const visibleOffset = clampOffset(
    offset ?? getCenteredOffset(viewportSize, worldView),
    viewportSize,
    worldView,
  )
  const worldTiles = useMemo(
    () => createTileGrid({ columns: worldView.columns, rows: worldView.rows }),
    [worldView.columns, worldView.rows],
  )
  const fenceTiles = useMemo(() => createFenceTiles(), [])
  const fencePosition = getFencePosition(worldView)
  const foodFactoryPosition = getFoodFactoryPosition(fencePosition)
  const foodOverlayPosition = getFoodOverlayPosition(fencePosition)
  const slimeYardPosition = getSlimeYardPosition(fencePosition)
  const summoningGroundPosition = getSummoningGroundPosition(fencePosition)
  const canSummonFromGround = (offlineUser?.daily_summons_left ?? 0) > 0
  const displayedSlimes = slimes.slice(0, 25)

  useEffect(() => {
    const worldViewElement = worldViewRef.current

    if (!worldViewElement) {
      return undefined
    }

    function resizeWorldView() {
      const { height, width } = worldViewElement.getBoundingClientRect()

      setViewportSize({ height, width })
    }

    const observer = new ResizeObserver(resizeWorldView)

    resizeWorldView()
    observer.observe(worldViewElement)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadOfflineDomain() {
      const user = await getOrCreateOfflineUser()
      const activeSlimes = await slimesRepository.listByUserId(user.id)

      if (!isCancelled) {
        setOfflineUser(user)
        setSlimes(activeSlimes)
      }
    }

    loadOfflineDomain()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setMenuMode('main')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startOffset: visibleOffset,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const nextOffset = {
      x: drag.startOffset.x + event.clientX - drag.startX,
      y: drag.startOffset.y + event.clientY - drag.startY,
    }

    setOffset(clampOffset(nextOffset, viewportSize, worldView))
  }

  function handlePointerUp(event) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    dragRef.current = null
  }

  function openMenu() {
    setMenuMode('main')
    setIsMenuOpen(true)
  }

  function closeMenu() {
    setIsMenuOpen(false)
    setMenuMode('main')
  }

  function confirmLogout() {
    setMenuMode('logged-out')
  }

  async function handleSummonSlime() {
    if (!offlineUser) {
      return
    }

    setSummoningOrbAnimationRun((run) => run + 1)

    try {
      const { slime, user } = await summonSlime(offlineUser.id)

      setOfflineUser(user)
      setSlimes((currentSlimes) => [...currentSlimes, slime])
    } catch (error) {
      console.warn('Unable to summon slime:', error)
    }
  }

  function handleSpriteButtonPointerDown(event) {
    event.stopPropagation()
  }

  function handleSpriteButtonPointerUp(event) {
    event.stopPropagation()
  }

  return (
    <main className="relative h-svh w-screen overflow-hidden bg-[#547244]">
      <button
        className="menu-button"
        type="button"
        aria-label="Open menu"
        aria-expanded={isMenuOpen}
        onClick={openMenu}
      >
        <img src={menuButtonSprite} alt="" draggable="false" />
      </button>
      {isMenuOpen && (
        <div
          className="menu-modal-backdrop"
          role="presentation"
          onClick={closeMenu}
        >
          <section
            className="menu-modal"
            role="dialog"
            aria-label="Game menu"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            {menuMode !== 'friends' && (
              <button
                className="menu-modal-close"
                type="button"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <span aria-hidden="true" />
              </button>
            )}
            {menuMode === 'main' && (
              <div className="menu-main-actions">
                <button
                  className="menu-modal-action"
                  type="button"
                  onClick={() => setMenuMode('friends')}
                >
                  FRIENDS
                </button>
                <button
                  className="menu-modal-action"
                  type="button"
                  onClick={() => setMenuMode('logout')}
                >
                  LOG OUT
                </button>
              </div>
            )}
            {menuMode === 'friends' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">FRIENDS</h2>
                <div className="friend-slots" aria-label="Friend slots">
                  {Array.from({ length: FRIEND_SLOTS }, (_, index) => (
                    <div className="friend-slot" key={index}>
                      EMPTY SLOT
                    </div>
                  ))}
                </div>
                <button
                  className="menu-modal-action menu-modal-action--small"
                  type="button"
                  onClick={() => setMenuMode('main')}
                >
                  BACK
                </button>
              </div>
            )}
            {menuMode === 'logout' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">LOG OUT?</h2>
                <div className="menu-confirm-actions">
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={confirmLogout}
                  >
                    YES
                  </button>
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => setMenuMode('main')}
                  >
                    NO
                  </button>
                </div>
              </div>
            )}
            {menuMode === 'logged-out' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">LOGGED OUT</h2>
                <button
                  className="menu-modal-action menu-modal-action--small"
                  type="button"
                  onClick={closeMenu}
                >
                  OK
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      <section
        ref={worldViewRef}
        className="world-view h-full w-full"
        aria-label="Slimy Pals world map"
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="world-camera"
          style={{
            transform: `translate(${visibleOffset.x}px, ${visibleOffset.y}px)`,
          }}
        >
          <div
            className="world-map grid bg-[#6f9552]"
            style={{
              width: worldView.columns * TILE_SIZE,
              height: worldView.rows * TILE_SIZE,
              gridTemplateColumns: `repeat(${worldView.columns}, ${TILE_SIZE}px)`,
              gridTemplateRows: `repeat(${worldView.rows}, ${TILE_SIZE}px)`,
              transform: `scale(${worldView.scale})`,
            }}
          >
            {worldTiles.map((tile) => (
              <img
                key={tile.id}
                className="map-tile"
                src={tile.src}
                alt=""
                draggable="false"
              />
            ))}
            <div
              className="slime-yard-zone grid"
              aria-hidden="true"
              style={{
                width: SLIME_YARD_COLUMNS * TILE_SIZE,
                height: SLIME_YARD_ROWS * TILE_SIZE,
                gridTemplateColumns: `repeat(${SLIME_YARD_COLUMNS}, ${TILE_SIZE}px)`,
                gridTemplateRows: `repeat(${SLIME_YARD_ROWS}, ${TILE_SIZE}px)`,
                transform: `translate(${slimeYardPosition.x}px, ${slimeYardPosition.y}px)`,
              }}
            >
              {Array.from({ length: SLIME_YARD_COLUMNS * SLIME_YARD_ROWS }, (_, index) => (
                <div className="slime-yard-tile" key={index} />
              ))}
            </div>
            <div
              className="slime-yard-slimes"
              aria-label="Summoned slimes"
              style={{
                width: SLIME_YARD_COLUMNS * TILE_SIZE,
                height: SLIME_YARD_ROWS * TILE_SIZE,
                transform: `translate(${slimeYardPosition.x}px, ${slimeYardPosition.y}px)`,
              }}
            >
              {displayedSlimes.map((slime, index) => {
                const slimeMotionPath = getSlimeMotionPath(slime, index)
                const overlaySprite = slimeOverlaySprites[slime.rarity]?.[slime.type]

                return (
                  <div
                    className="yard-slime"
                    key={slime.id}
                    style={{
                      '--slime-frame-count': 4,
                      '--slime-frame-height': `${SLIME_FRAME_HEIGHT}px`,
                      '--slime-frame-width': `${SLIME_FRAME_WIDTH}px`,
                      '--slime-scale': SLIME_SCALE,
                      '--slime-x-0': `${slimeMotionPath.points[0].x}px`,
                      '--slime-y-0': `${slimeMotionPath.points[0].y}px`,
                      '--slime-x-1': `${slimeMotionPath.points[1].x}px`,
                      '--slime-y-1': `${slimeMotionPath.points[1].y}px`,
                      '--slime-x-2': `${slimeMotionPath.points[2].x}px`,
                      '--slime-y-2': `${slimeMotionPath.points[2].y}px`,
                      '--slime-x-3': `${slimeMotionPath.points[3].x}px`,
                      '--slime-y-3': `${slimeMotionPath.points[3].y}px`,
                      '--slime-face-0': slimeMotionPath.faces[0],
                      '--slime-face-1': slimeMotionPath.faces[1],
                      '--slime-face-2': slimeMotionPath.faces[2],
                      '--slime-face-3': slimeMotionPath.faces[3],
                      '--slime-wander-delay': `${index * -1.7}s`,
                    }}
                  >
                    <div className="yard-slime-facing">
                      <div
                        className="yard-slime-base"
                        style={{
                          '--slime-base-sprite': `url(${simpleSlimeSprite})`,
                          '--slime-filter': getSlimeColorFilter(slime.color),
                        }}
                      />
                      {overlaySprite && (
                        <div
                          className="yard-slime-overlay"
                          style={{
                            backgroundImage: `url(${overlaySprite})`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              className="fence-overlay grid"
              style={{
                width: FENCE_COLUMNS * TILE_SIZE,
                height: FENCE_ROWS * TILE_SIZE,
                gridTemplateColumns: `repeat(${FENCE_COLUMNS}, ${TILE_SIZE}px)`,
                gridTemplateRows: `repeat(${FENCE_ROWS}, ${TILE_SIZE}px)`,
                transform: `translate(${fencePosition.x}px, ${fencePosition.y}px)`,
              }}
            >
              {fenceTiles.map((tile) => (
                <div key={tile.id} className="fence-cell map-tile">
                  {tile.layers.map((layer) => (
                    <img
                      key={`${tile.id}-${layer.id}`}
                      className={`fence-layer map-tile${layer.isRightColumn ? ' fence-tile--right' : ''}`}
                      src={layer.src}
                      alt=""
                      draggable="false"
                    />
                  ))}
                </div>
              ))}
            </div>
            <button
              key={`food-factory-${foodFactoryAnimationRun}`}
              className={`food-factory${foodFactoryAnimationRun > 0 ? ' food-factory--active' : ''}`}
              type="button"
              aria-label="Produce slime food"
              onAnimationEnd={() => setFoodFactoryAnimationRun(0)}
              onClick={(event) => {
                event.stopPropagation()
                setFoodFactoryAnimationRun((run) => run + 1)
              }}
              onPointerCancel={handleSpriteButtonPointerUp}
              onPointerDown={handleSpriteButtonPointerDown}
              onPointerUp={handleSpriteButtonPointerUp}
              style={{
                '--food-factory-frame-count': FOOD_FACTORY_FRAME_COUNT,
                '--food-factory-frame-height': `${FOOD_FACTORY_FRAME_HEIGHT}px`,
                '--food-factory-frame-width': `${FOOD_FACTORY_FRAME_WIDTH}px`,
                '--food-factory-scale': FOOD_FACTORY_SCALE,
                backgroundImage: `url(${foodFactorySprite})`,
                transform: `translate(${foodFactoryPosition.x}px, ${foodFactoryPosition.y}px)`,
              }}
            />
            <button
              className={`summoning-ground${canSummonFromGround ? '' : ' summoning-ground--disabled'}`}
              type="button"
              aria-label="Summon slime"
              disabled={!canSummonFromGround}
              onClick={async (event) => {
                event.stopPropagation()
                await handleSummonSlime()
              }}
              onPointerCancel={handleSpriteButtonPointerUp}
              onPointerDown={handleSpriteButtonPointerDown}
              onPointerUp={handleSpriteButtonPointerUp}
              style={{
                '--summoning-ground-frame-count': SUMMONING_GROUND_FRAME_COUNT,
                '--summoning-ground-frame-height': `${SUMMONING_GROUND_FRAME_HEIGHT}px`,
                '--summoning-ground-frame-width': `${SUMMONING_GROUND_FRAME_WIDTH}px`,
                '--summoning-ground-scale': SUMMONING_GROUND_SCALE,
                backgroundImage: `url(${summoningGroundSprite})`,
                transform: `translate(${summoningGroundPosition.x}px, ${summoningGroundPosition.y}px)`,
              }}
            >
              {summoningOrbAnimationRun > 0 && (
                <span
                  key={`summoning-orb-${summoningOrbAnimationRun}`}
                  className="summoning-orb summoning-orb--active"
                  aria-hidden="true"
                  onAnimationEnd={() => setSummoningOrbAnimationRun(0)}
                  style={{
                    backgroundImage: `url(${summoningOrbSprite})`,
                  }}
                />
              )}
            </button>
            <img
              className="food-overlay"
              src={foodSprite}
              alt=""
              aria-hidden="true"
              draggable="false"
              style={{
                width: FOOD_OVERLAY_WIDTH,
                height: FOOD_OVERLAY_HEIGHT,
                transform: `translate(${foodOverlayPosition.x}px, ${foodOverlayPosition.y}px)`,
              }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
