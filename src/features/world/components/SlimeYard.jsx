import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SLIME_FRAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_MOVEMENT_HEIGHT,
  SLIME_MOVEMENT_OFFSET_X,
  SLIME_MOVEMENT_OFFSET_Y,
  SLIME_MOVEMENT_WIDTH,
  SLIME_SCALE,
  SLIME_YARD_COLUMNS,
  SLIME_YARD_ROWS,
  TILE_SIZE,
} from '../../../game/worldConstants'
import { getGridSizeStyle } from '../../../game/mapTiles'
import {
  getSlimeColorFilter,
  getSlimeMotionPath,
  getSlimeMovementDepth,
} from '../../../game/slimePresentation'
import {
  getSlimeBaseSprite,
  getSlimeOverlayShadowSprite,
  getSlimeOverlaySprite,
  getSlimeShadowSprite,
} from '../../../game/slimeSprites'
import { getSlimeDisplayName } from '../../../game/slimeText'
import killButtonSprite from '../../../assets/buttons/deathbutton.png'
import slimeBlackholeDeathSprite from '../../../assets/slimes/effects/slime_blackhole_death.png'
import { SLIME_LEVELS } from '../../../services/slimyPalsDb'

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
const SLIME_WANDER_SPEED_SECONDS_BY_LEVEL = Object.freeze({
  [SLIME_LEVELS.BABY]: 56,
  [SLIME_LEVELS.TEEN]: 38,
  [SLIME_LEVELS.ADULT]: 28,
})
const SLIME_HITBOXES_BY_LEVEL = Object.freeze({
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

function SlimeYard({
  appearingSlimeIds = [],
  canRemoveSlimes = true,
  displayedSlimes,
  dyingSlimeIds = [],
  feedTargetOwner = null,
  feedTargetOwnerId = null,
  feedTargetType = 'own',
  isFeedTarget = true,
  onDeathAnimationEnd,
  onPokeFriendSlime,
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
          left: slimeYardPosition.x,
          top: slimeYardPosition.y,
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
          left: slimeYardPosition.x,
          top: slimeYardPosition.y,
        }}
      >
        {displayedSlimes.map((slime) => (
          <YardSlime
            key={slime.id}
            canRemoveSlimes={canRemoveSlimes}
            feedTargetOwner={feedTargetOwner}
            feedTargetOwnerId={feedTargetOwnerId}
            feedTargetType={feedTargetType}
            isAppearing={appearingSlimeIds.includes(slime.id)}
            isFeedTarget={isFeedTarget}
            isDying={dyingSlimeIds.includes(slime.id)}
            onDeathAnimationEnd={onDeathAnimationEnd}
            onPokeFriendSlime={onPokeFriendSlime}
            onRemoveSlime={onRemoveSlime}
            slimeDepthOffsetY={slimeYardPosition.y}
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
  isAppearing,
  isFeedTarget,
  isDying,
  onDeathAnimationEnd,
  onPokeFriendSlime,
  onRemoveSlime,
  slimeDepthOffsetY,
  slime,
}) {
  const slimeRef = useRef(null)
  const slimeFacingRef = useRef(null)
  const slimeHitboxRef = useRef(null)
  const levelTimerRef = useRef(null)
  const lastFacingRef = useRef(1)
  const wanderProgressRef = useRef(null)
  const [jumpRun, setJumpRun] = useState(0)
  const [isLevelPinned, setIsLevelPinned] = useState(false)
  const slimeId = slime.id
  const slimeMotionPath = useMemo(
    () => getSlimeMotionPath({ id: slimeId }),
    [slimeId],
  )
  const baseSprite = getSlimeBaseSprite(slime.level)
  const shadowSprite = getSlimeShadowSprite(slime.level)
  const overlaySprite = getSlimeOverlaySprite(slime)
  const overlayShadowSprite = getSlimeOverlayShadowSprite(slime)
  const slimeDepths = slimeMotionPath.points.map(getSlimeMovementDepth)
  const slimeHitbox =
    SLIME_HITBOXES_BY_LEVEL[slime.level] ?? SLIME_HITBOXES_BY_LEVEL[SLIME_LEVELS.ADULT]
  const slimeWanderSpeedSeconds =
    SLIME_WANDER_SPEED_SECONDS_BY_LEVEL[slime.level] ??
    SLIME_WANDER_SPEED_SECONDS_BY_LEVEL[SLIME_LEVELS.ADULT]

  useEffect(() => {
    return () => window.clearTimeout(levelTimerRef.current)
  }, [])

  useEffect(() => {
    const slimeElement = slimeRef.current
    const facingElement = slimeFacingRef.current
    const hitboxElement = slimeHitboxRef.current

    if (!slimeElement || !facingElement || !hitboxElement || isDying) {
      return undefined
    }

    let animationFrameId = 0
    let lastFrameTime = performance.now()

    if (wanderProgressRef.current === null) {
      wanderProgressRef.current = seededRandom(slimeId, 'wander')
    }

    function updateSlimePosition(frameTime) {
      const elapsedSeconds = (frameTime - lastFrameTime) / 1000
      lastFrameTime = frameTime
      wanderProgressRef.current = (
        wanderProgressRef.current +
        elapsedSeconds / slimeWanderSpeedSeconds
      ) % 1

      const { face, point } = getSlimeMotionFrame(
        slimeMotionPath,
        wanderProgressRef.current,
        lastFacingRef.current,
      )

      slimeElement.style.transform = `translate(${point.x}px, ${point.y}px)`
      slimeElement.style.zIndex = Math.round(slimeDepthOffsetY + getSlimeMovementDepth(point))
      facingElement.style.transform = `scaleX(${face})`
      hitboxElement.style.left = face === -1
        ? 'var(--slime-hitbox-offset-x-flipped)'
        : 'var(--slime-hitbox-offset-x)'
      lastFacingRef.current = face

      animationFrameId = window.requestAnimationFrame(updateSlimePosition)
    }

    updateSlimePosition(lastFrameTime)

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [isDying, jumpRun, slimeDepthOffsetY, slimeId, slimeMotionPath, slimeWanderSpeedSeconds])

  function handlePointerDown(event) {
    if (isDying) {
      return
    }

    event.stopPropagation()
    setJumpRun((run) => run + 1)
    setIsLevelPinned(true)
    if (feedTargetType === 'friend' && feedTargetOwnerId) {
      onPokeFriendSlime?.({
        friendUserId: feedTargetOwnerId,
        friendUsername: feedTargetOwner,
        slimeId: slime.id,
        slimeName: getSlimeDisplayName(slime),
      })
    }
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
      ref={slimeRef}
      className={`yard-slime${isAppearing ? ' yard-slime--appearing' : ''}${isDying ? ' yard-slime--dying' : ''}`}
      style={{
        '--slime-death-frame-aspect-ratio': SLIME_DEATH_FRAME_ASPECT_RATIO,
        '--slime-death-frame-count': SLIME_DEATH_FRAME_COUNT,
        '--slime-death-frame-height': `calc(${SLIME_FRAME_HEIGHT}px * ${SLIME_SCALE})`,
        '--slime-death-sprite': `url(${slimeBlackholeDeathSprite})`,
        '--slime-frame-count': 4,
        '--slime-frame-height': `${SLIME_FRAME_HEIGHT}px`,
        '--slime-frame-width': `${SLIME_FRAME_WIDTH}px`,
        '--slime-hitbox-height': `${slimeHitbox.height * SLIME_SCALE}px`,
        '--slime-hitbox-offset-x': `${slimeHitbox.offsetX * SLIME_SCALE}px`,
        '--slime-hitbox-offset-x-flipped': `${
          (SLIME_FRAME_WIDTH - slimeHitbox.offsetX - slimeHitbox.width) * SLIME_SCALE
        }px`,
        '--slime-hitbox-offset-y': `${slimeHitbox.offsetY * SLIME_SCALE}px`,
        '--slime-hitbox-width': `${slimeHitbox.width * SLIME_SCALE}px`,
        '--slime-scale': SLIME_SCALE,
        '--slime-x-0': `${slimeMotionPath.points[0].x}px`,
        '--slime-y-0': `${slimeMotionPath.points[0].y}px`,
        '--slime-x-1': `${slimeMotionPath.points[1].x}px`,
        '--slime-y-1': `${slimeMotionPath.points[1].y}px`,
        '--slime-x-2': `${slimeMotionPath.points[2].x}px`,
        '--slime-y-2': `${slimeMotionPath.points[2].y}px`,
        '--slime-x-3': `${slimeMotionPath.points[3].x}px`,
        '--slime-y-3': `${slimeMotionPath.points[3].y}px`,
        '--slime-z-0': slimeDepths[0],
        '--slime-z-1': slimeDepths[1],
        '--slime-z-2': slimeDepths[2],
        '--slime-z-3': slimeDepths[3],
        '--slime-face-0': slimeMotionPath.faces[0],
        '--slime-face-1': slimeMotionPath.faces[1],
        '--slime-face-2': slimeMotionPath.faces[2],
        '--slime-face-3': slimeMotionPath.faces[3],
        '--slime-idle-delay': `-${(seededRandom(slime.id, 'idle') * 1.3).toFixed(3)}s`,
      }}
    >
      <div
        key={jumpRun}
        ref={slimeFacingRef}
        className="yard-slime-facing"
      >
        <div className="yard-slime-shadow-layer">
          <div
            className="yard-slime-shadow"
            style={{
              '--slime-shadow-sprite': `url(${shadowSprite})`,
            }}
          />
          {overlayShadowSprite && (
            <div
              className="yard-slime-overlay-shadow"
              style={{
                backgroundImage: `url(${overlayShadowSprite})`,
              }}
            />
          )}
        </div>
        <div className={`yard-slime-jump${jumpRun > 0 ? ' yard-slime-jump--active' : ''}`}>
          <div
            className="yard-slime-base"
            style={{
              '--slime-base-sprite': `url(${baseSprite})`,
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
      <span
        ref={slimeHitboxRef}
        className="yard-slime-hitbox"
        aria-hidden="true"
        data-feed-target-owner={isFeedTarget && !isDying ? feedTargetOwner : undefined}
        data-feed-target-owner-id={isFeedTarget && !isDying ? feedTargetOwnerId : undefined}
        data-feed-target-type={isFeedTarget && !isDying ? feedTargetType : undefined}
        data-slime-id={isFeedTarget && !isDying ? slime.id : undefined}
        data-slime-last-fed-at={isFeedTarget && !isDying ? slime.last_fed_at : undefined}
        data-slime-level={isFeedTarget && !isDying ? slime.level : undefined}
        data-slime-name={isFeedTarget && !isDying ? getSlimeDisplayName(slime) : undefined}
        onPointerDown={handlePointerDown}
      />
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
          <span className="yard-slime-kill-wrap">
            <span className="yard-slime-kill-label" aria-hidden="true">Kill</span>
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
          </span>
        )}
      </div>
    </div>
  )
}

function getSlimeMotionFrame(slimeMotionPath, progress, fallbackFace) {
  const segmentProgress = progress * slimeMotionPath.points.length
  const pointIndex = Math.floor(segmentProgress) % slimeMotionPath.points.length
  const nextPointIndex = (pointIndex + 1) % slimeMotionPath.points.length
  const progressBetweenPoints = segmentProgress - Math.floor(segmentProgress)
  const fromPoint = slimeMotionPath.points[pointIndex]
  const toPoint = slimeMotionPath.points[nextPointIndex]
  const point = interpolatePoint(
    fromPoint,
    toPoint,
    progressBetweenPoints,
  )

  return {
    face: getFaceForHorizontalMovement(toPoint.x - fromPoint.x, fallbackFace),
    point,
  }
}

function getFaceForHorizontalMovement(deltaX, fallbackFace) {
  if (Math.abs(deltaX) < 0.25) {
    return fallbackFace
  }

  return deltaX > 0 ? -1 : 1
}

function interpolatePoint(fromPoint, toPoint, progress) {
  return {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
  }
}

export default SlimeYard
