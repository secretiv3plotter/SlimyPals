import { useEffect, useRef, useState } from 'react'
import { DEFAULT_VIEWPORT } from '../game/worldConstants'
import { clampOffset, getCenteredOffset } from '../game/worldLayout'
import WorldMap from './WorldMap'

const FOOD_DRAG_EDGE_SIZE = 72
const FOOD_DRAG_MAX_PAN_SPEED = 8

function WorldView({
  canProduceFood,
  canSummon,
  displayedSlimes,
  foodFactoryAnimationRun,
  foodQuantity,
  onFoodFactoryAnimationEnd,
  onFoodFactoryClick,
  onFeedFriendSlime,
  onFeedSlime,
  onRemoveSlime,
  onSlimeSummon,
  onSummoningOrbAnimationEnd,
  summoningOrbAnimationRun,
  worldView,
}) {
  const worldViewRef = useRef(null)
  const dragRef = useRef(null)
  const foodDragPointRef = useRef(null)
  const visibleOffsetRef = useRef(null)
  const viewportSizeRef = useRef(DEFAULT_VIEWPORT)
  const [viewportSize, setViewportSize] = useState(DEFAULT_VIEWPORT)
  const [offset, setOffset] = useState(null)
  const visibleOffset = clampOffset(
    offset ?? getCenteredOffset(viewportSize, worldView),
    viewportSize,
    worldView,
  )

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
    visibleOffsetRef.current = visibleOffset
  }, [visibleOffset])

  useEffect(() => {
    viewportSizeRef.current = viewportSize
  }, [viewportSize])

  useEffect(() => {
    let animationFrameId = 0

    function panTowardFoodDragEdge() {
      const point = foodDragPointRef.current
      const worldViewElement = worldViewRef.current

      if (point && worldViewElement) {
        const rect = worldViewElement.getBoundingClientRect()
        const pan = getFoodDragEdgePan(point, rect)

        if (pan.x !== 0 || pan.y !== 0) {
          setOffset((currentOffset) => {
            const baseOffset = currentOffset ?? visibleOffsetRef.current

            return clampOffset(
              {
                x: baseOffset.x + pan.x,
                y: baseOffset.y + pan.y,
              },
              viewportSizeRef.current,
              worldView,
            )
          })
        }
      }

      animationFrameId = window.requestAnimationFrame(panTowardFoodDragEdge)
    }

    animationFrameId = window.requestAnimationFrame(panTowardFoodDragEdge)

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [worldView])

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

  function handleSpriteButtonPointerDown(event) {
    event.stopPropagation()
  }

  function handleSpriteButtonPointerUp(event) {
    event.stopPropagation()
  }

  function handleFoodDragMove(point) {
    foodDragPointRef.current = point
  }

  function handleFoodDragEnd() {
    foodDragPointRef.current = null
  }

  return (
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
        <WorldMap
          canProduceFood={canProduceFood}
          canSummon={canSummon}
          displayedSlimes={displayedSlimes}
          foodFactoryAnimationRun={foodFactoryAnimationRun}
          foodQuantity={foodQuantity}
          onFoodFactoryAnimationEnd={onFoodFactoryAnimationEnd}
          onFoodFactoryClick={onFoodFactoryClick}
          onFoodDragEnd={handleFoodDragEnd}
          onFoodDragMove={handleFoodDragMove}
          onFeedFriendSlime={onFeedFriendSlime}
          onFeedSlime={onFeedSlime}
          onRemoveSlime={onRemoveSlime}
          onSlimeSummon={onSlimeSummon}
          onSpritePointerDown={handleSpriteButtonPointerDown}
          onSpritePointerUp={handleSpriteButtonPointerUp}
          onSummoningOrbAnimationEnd={onSummoningOrbAnimationEnd}
          summoningOrbAnimationRun={summoningOrbAnimationRun}
          worldView={worldView}
        />
      </div>
    </section>
  )
}

function getFoodDragEdgePan(point, rect) {
  const x = point.x - rect.left
  const y = point.y - rect.top

  return {
    x:
      getAxisEdgePan(x, rect.width, 1) +
      getAxisEdgePan(rect.width - x, rect.width, -1),
    y:
      getAxisEdgePan(y, rect.height, 1) +
      getAxisEdgePan(rect.height - y, rect.height, -1),
  }
}

function getAxisEdgePan(distanceFromEdge, size, direction) {
  if (size <= 0 || distanceFromEdge >= FOOD_DRAG_EDGE_SIZE) {
    return 0
  }

  const strength = 1 - Math.max(0, distanceFromEdge) / FOOD_DRAG_EDGE_SIZE

  return direction * FOOD_DRAG_MAX_PAN_SPEED * strength
}

export default WorldView
