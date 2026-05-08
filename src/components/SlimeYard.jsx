import { useEffect, useRef, useState } from 'react'
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

function SlimeYard({ displayedSlimes, onRemoveSlime, slimeYardPosition }) {
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
          <YardSlime
            key={slime.id}
            index={index}
            onRemoveSlime={onRemoveSlime}
            slime={slime}
          />
        ))}
      </div>
    </>
  )
}

function YardSlime({ index, onRemoveSlime, slime }) {
  const levelTimerRef = useRef(null)
  const [jumpRun, setJumpRun] = useState(0)
  const [isLevelPinned, setIsLevelPinned] = useState(false)
  const slimeMotionPath = getSlimeMotionPath(slime, index)
  const overlaySprite = slimeOverlaySprites[slime.rarity]?.[slime.type]

  useEffect(() => {
    return () => window.clearTimeout(levelTimerRef.current)
  }, [])

  function handlePointerDown(event) {
    event.stopPropagation()
    setJumpRun((run) => run + 1)
    setIsLevelPinned(true)
    window.clearTimeout(levelTimerRef.current)
    levelTimerRef.current = window.setTimeout(() => {
      setIsLevelPinned(false)
    }, 5000)
  }

  function handleKillClick(event) {
    event.stopPropagation()
    onRemoveSlime(slime)
  }

  return (
    <div
      className="yard-slime"
      data-slime-id={slime.id}
      onPointerDown={handlePointerDown}
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
      <div
        key={jumpRun}
        className={`yard-slime-jump${jumpRun > 0 ? ' yard-slime-jump--active' : ''}`}
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
      <div className={`yard-slime-level${isLevelPinned ? ' yard-slime-level--pinned' : ''}`}>
        <span>Level {slime.level}</span>
        <button
          className="yard-slime-kill"
          type="button"
          aria-label={`Kill level ${slime.level} slime`}
          onClick={handleKillClick}
          onPointerDown={(event) => event.stopPropagation()}
        >
          KILL
        </button>
      </div>
    </div>
  )
}

export default SlimeYard
