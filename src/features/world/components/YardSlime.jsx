import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SLIME_FRAME_HEIGHT,
  SLIME_FRAME_WIDTH,
  SLIME_SCALE,
} from '../layout/worldConstants'
import {
  getSlimeColorFilter,
  getSlimeMotionPath,
  getSlimeMovementDepth,
} from '../../../domain/slimes/slimePresentation'
import {
  getSlimeBaseSprite,
  getSlimeOverlayShadowSprite,
  getSlimeOverlaySprite,
  getSlimeShadowSprite,
} from '../../../domain/slimes/slimeSprites'
import { getSlimeDisplayName } from '../../../domain/slimes/slimeText'
import killButtonSprite from '../../../assets/buttons/deathbutton.png'
import slimeBlackholeDeathSprite from '../../../assets/slimes/effects/slime_blackhole_death.png'
import { SLIME_LEVELS } from '../../../infrastructure/db'
import {
  SLIME_DEATH_FRAME_ASPECT_RATIO,
  SLIME_DEATH_FRAME_COUNT,
  SLIME_HITBOXES_BY_LEVEL,
  SLIME_WANDER_SPEED_SECONDS_BY_LEVEL,
} from './slimeYardConstants'
import { getSlimeMotionFrame, seededRandom } from './slimeMotion'

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
  pokeRun,
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
    if (pokeRun > 0 && !isDying) {
      const animationFrameId = window.requestAnimationFrame(() => {
        setJumpRun((run) => run + 1)
      })

      return () => window.cancelAnimationFrame(animationFrameId)
    }

    return undefined
  }, [isDying, pokeRun])

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

export default YardSlime
