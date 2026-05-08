import { useEffect, useState } from 'react'
import foodFactorySprite from '../assets/sprites/foodfactory.png'
import {
  FOOD_FACTORY_CLICK_ALPHA_THRESHOLD,
  FOOD_FACTORY_FRAME_COUNT,
  FOOD_FACTORY_FRAME_HEIGHT,
  FOOD_FACTORY_FRAME_WIDTH,
  FOOD_FACTORY_SCALE,
} from '../game/worldConstants'

function useSpriteAlphaMap(src) {
  const [alphaMap, setAlphaMap] = useState(null)

  useEffect(() => {
    let isCancelled = false
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      context.drawImage(image, 0, 0)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      if (!isCancelled) {
        setAlphaMap({
          data: imageData.data,
          height: imageData.height,
          width: imageData.width,
        })
      }
    }

    image.src = src

    return () => {
      isCancelled = true
    }
  }, [src])

  return alphaMap
}

function isPointerOnOpaqueSpritePixel(
  event,
  alphaMap,
  { alphaThreshold = 0, frameCount, frameHeight, frameWidth },
) {
  if (!alphaMap) {
    return true
  }

  const element = event.currentTarget
  const rect = element.getBoundingClientRect()
  const localX = event.clientX - rect.left
  const localY = event.clientY - rect.top

  if (localX < 0 || localX >= rect.width || localY < 0 || localY >= rect.height) {
    return false
  }

  const backgroundPositionX = Number.parseFloat(
    getComputedStyle(element).backgroundPositionX,
  )
  const frameIndex = Number.isFinite(backgroundPositionX)
    ? Math.min(
        frameCount - 1,
        Math.max(0, Math.floor(Math.abs(backgroundPositionX) / rect.width)),
      )
    : 0
  const pixelX = Math.floor(frameIndex * frameWidth + (localX / rect.width) * frameWidth)
  const pixelY = Math.floor((localY / rect.height) * frameHeight)

  if (
    pixelX < 0 ||
    pixelX >= alphaMap.width ||
    pixelY < 0 ||
    pixelY >= Math.min(frameHeight, alphaMap.height)
  ) {
    return false
  }

  return alphaMap.data[(pixelY * alphaMap.width + pixelX) * 4 + 3] > alphaThreshold
}

function FoodFactory({
  animationRun,
  foodFactoryPosition,
  onAnimationEnd,
  onClick,
  onSpritePointerDown,
  onSpritePointerUp,
}) {
  const alphaMap = useSpriteAlphaMap(foodFactorySprite)
  const [isHoverClickable, setIsHoverClickable] = useState(false)

  function isOpaqueAtPointer(event) {
    return isPointerOnOpaqueSpritePixel(event, alphaMap, {
      alphaThreshold: FOOD_FACTORY_CLICK_ALPHA_THRESHOLD,
      frameCount: FOOD_FACTORY_FRAME_COUNT,
      frameHeight: FOOD_FACTORY_FRAME_HEIGHT,
      frameWidth: FOOD_FACTORY_FRAME_WIDTH,
    })
  }

  function handleClick(event) {
    if (isOpaqueAtPointer(event)) {
      onClick(event)
    }
  }

  function handlePointerDown(event) {
    if (isOpaqueAtPointer(event)) {
      onSpritePointerDown(event)
    }
  }

  function handlePointerMove(event) {
    setIsHoverClickable(isOpaqueAtPointer(event))
  }

  function handlePointerLeave() {
    setIsHoverClickable(false)
  }

  function handlePointerUp(event) {
    if (isOpaqueAtPointer(event)) {
      onSpritePointerUp(event)
    }
  }

  return (
    <button
      key={`food-factory-${animationRun}`}
      className={`food-factory${animationRun > 0 ? ' food-factory--active' : ''}${isHoverClickable ? ' food-factory--clickable' : ''}`}
      type="button"
      aria-label="Produce slime food"
      onAnimationEnd={onAnimationEnd}
      onClick={handleClick}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        '--food-factory-frame-count': FOOD_FACTORY_FRAME_COUNT,
        '--food-factory-frame-height': `${FOOD_FACTORY_FRAME_HEIGHT}px`,
        '--food-factory-frame-width': `${FOOD_FACTORY_FRAME_WIDTH}px`,
        '--food-factory-scale': FOOD_FACTORY_SCALE,
        backgroundImage: `url(${foodFactorySprite})`,
        transform: `translate(${foodFactoryPosition.x}px, ${foodFactoryPosition.y}px)`,
      }}
    />
  )
}

export default FoodFactory
