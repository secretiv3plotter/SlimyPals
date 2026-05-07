import { useEffect, useRef, useState } from 'react'
import { DEFAULT_VIEWPORT } from '../game/worldConstants'
import { clampOffset, getCenteredOffset } from '../game/worldLayout'
import WorldMap from './WorldMap'

function WorldView({
  canSummon,
  displayedSlimes,
  foodFactoryAnimationRun,
  onFoodFactoryAnimationEnd,
  onFoodFactoryClick,
  onSlimeSummon,
  onSummoningOrbAnimationEnd,
  summoningOrbAnimationRun,
  worldView,
}) {
  const worldViewRef = useRef(null)
  const dragRef = useRef(null)
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
          canSummon={canSummon}
          displayedSlimes={displayedSlimes}
          foodFactoryAnimationRun={foodFactoryAnimationRun}
          onFoodFactoryAnimationEnd={onFoodFactoryAnimationEnd}
          onFoodFactoryClick={onFoodFactoryClick}
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

export default WorldView
