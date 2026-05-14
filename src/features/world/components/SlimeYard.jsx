import { useEffect, useRef, useState } from 'react'
import {
  SLIME_FRAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_SCALE,
  SLIME_YARD_COLUMNS,
  SLIME_YARD_ROWS,
  TILE_SIZE,
} from '../../../game/worldConstants'
import { getGridSizeStyle } from '../../../game/mapTiles'
import { getSlimeColorFilter, getSlimeMotionPath } from '../../../game/slimePresentation'
import { simpleSlimeSprite, slimeOverlaySprites } from '../../../game/slimeSprites'
import { getSlimeDisplayName } from '../../../game/slimeText'
import killButtonSprite from '../../../assets/slimes/ui/deathbutton.png'
import slimeBlackholeDeathSprite from '../../../assets/slimes/effects/slime_blackhole_death.png'

// Deterministic pseudo-random 0–1 value derived from a slime's ID + salt.
// Stable across page refreshes but unique per slime, so animations are
// naturally desynchronised without resetting on reload.
function seededRandom(id, salt = '') {
  const str = String(id) + salt
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xfffffff
  }
  return hash / 0xfffffff
}

const SLIME_DEATH_FRAME_COUNT = 6
const SLIME_DEATH_FRAME_ASPECT_RATIO = 47 / 44

function SlimeYard({
  canRemoveSlimes = true,
  displayedSlimes,
  dyingSlimeIds = [],
  feedTargetOwner = null,
  feedTargetOwnerId = null,
  feedTargetType = 'own',
  isFeedTarget = true,
  onDeathAnimationEnd,
  onRemoveSlime,
  slimeYardPosition,
}) {
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
            canRemoveSlimes={canRemoveSlimes}
            feedTargetOwner={feedTargetOwner}
            feedTargetOwnerId={feedTargetOwnerId}
            feedTargetType={feedTargetType}
            index={index}
            isFeedTarget={isFeedTarget}
            isDying={dyingSlimeIds.includes(slime.id)}
            onDeathAnimationEnd={onDeathAnimationEnd}
            onRemoveSlime={onRemoveSlime}
            slime={slime}
          />
        ))}
      </div>
    </>
  )
}

function YardSlime({
  canRemoveSlimes,
  feedTargetOwner,
  feedTargetOwnerId,
  feedTargetType,
  index,
  isFeedTarget,
  isDying,
  onDeathAnimationEnd,
  onRemoveSlime,
  slime,
}) {
  const levelTimerRef = useRef(null)
  const [jumpRun, setJumpRun] = useState(0)
  const [isLevelPinned, setIsLevelPinned] = useState(false)
  const slimeMotionPath = getSlimeMotionPath(slime, index)
  const overlaySprite = slimeOverlaySprites[slime.rarity]?.[slime.type]

  useEffect(() => {
    return () => window.clearTimeout(levelTimerRef.current)
  }, [])

  function handlePointerDown(event) {
    if (isDying) {
      return
    }

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
    onRemoveSlime?.(slime)
  }

  return (
    <div
      className={`yard-slime${isDying ? ' yard-slime--dying' : ''}`}
      data-feed-target-owner={isFeedTarget && !isDying ? feedTargetOwner : undefined}
      data-feed-target-owner-id={isFeedTarget && !isDying ? feedTargetOwnerId : undefined}
      data-feed-target-type={isFeedTarget && !isDying ? feedTargetType : undefined}
      data-slime-id={isFeedTarget && !isDying ? slime.id : undefined}
      data-slime-last-fed-at={isFeedTarget && !isDying ? slime.last_fed_at : undefined}
      data-slime-level={isFeedTarget && !isDying ? slime.level : undefined}
      data-slime-name={isFeedTarget && !isDying ? getSlimeDisplayName(slime) : undefined}
      onPointerDown={handlePointerDown}
      style={{
        '--slime-death-frame-aspect-ratio': SLIME_DEATH_FRAME_ASPECT_RATIO,
        '--slime-death-frame-count': SLIME_DEATH_FRAME_COUNT,
        '--slime-death-frame-height': `calc(${SLIME_FRAME_HEIGHT}px * ${SLIME_SCALE})`,
        '--slime-death-sprite': `url(${slimeBlackholeDeathSprite})`,
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
        // Negative delays start the animation mid-cycle, giving each slime
        // a unique starting point that is stable across page refreshes.
        '--slime-wander-delay': `-${(seededRandom(slime.id, 'wander') * 28).toFixed(2)}s`,
        '--slime-idle-delay': `-${(seededRandom(slime.id, 'idle') * 1.3).toFixed(3)}s`,
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
      {isDying && (
        <span
          className="yard-slime-death"
          aria-hidden="true"
          onAnimationEnd={() => onDeathAnimationEnd?.(slime.id)}
        />
      )}
      <div className={`yard-slime-level${isLevelPinned ? ' yard-slime-level--pinned' : ''}`}>
        <span>Level {slime.level}</span>
        {canRemoveSlimes && (
          <button
            className="yard-slime-kill"
            type="button"
            aria-label={`Kill level ${slime.level} slime`}
            onClick={handleKillClick}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <img
              src={killButtonSprite}
              alt=""
              draggable="false"
            />
          </button>
        )}
      </div>
    </div>
  )
}

export default SlimeYard
