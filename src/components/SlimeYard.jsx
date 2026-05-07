import {
  SLIME_FRAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_SCALE,
  SLIME_YARD_COLUMNS,
  SLIME_YARD_ROWS,
  TILE_SIZE,
} from '../game/worldConstants'
import { getGridSizeStyle } from '../game/mapTiles'
import { getSlimeColorFilter, getSlimeMotionPath } from '../game/slimePresentation'
import { simpleSlimeSprite, slimeOverlaySprites } from '../game/slimeSprites'

function SlimeYard({ displayedSlimes, slimeYardPosition }) {
  return (
    <>
      <div
        className="slime-yard-zone grid"
        aria-hidden="true"
        style={{
          width: SLIME_YARD_COLUMNS * TILE_SIZE,
          height: SLIME_YARD_ROWS * TILE_SIZE,
          ...getGridSizeStyle({ columns: SLIME_YARD_COLUMNS, rows: SLIME_YARD_ROWS }),
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
        {displayedSlimes.map((slime, index) => (
          <YardSlime key={slime.id} index={index} slime={slime} />
        ))}
      </div>
    </>
  )
}

function YardSlime({ index, slime }) {
  const slimeMotionPath = getSlimeMotionPath(slime, index)
  const overlaySprite = slimeOverlaySprites[slime.rarity]?.[slime.type]

  return (
    <div
      className="yard-slime"
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
}

export default SlimeYard
