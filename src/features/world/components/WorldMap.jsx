import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import foodSprite from '../../../assets/foodfactory/food.png'
import { createFenceTiles, createTileGrid, getGridSizeStyle } from '../../../game/mapTiles'
import {
  FOOD_OVERLAY_HEIGHT,
  FOOD_OVERLAY_WIDTH,
  TILE_SIZE,
} from '../../../game/worldConstants'
import {
  getFencePosition,
  getFoodFactoryPosition,
  getFoodOverlayPosition,
  getSlimeYardPosition,
  getSummoningGroundPosition,
} from '../../../game/worldLayout'
import FenceOverlay from './FenceOverlay'
import FoodFactory from './FoodFactory'
import FriendYardPlaceholders from './FriendYardPlaceholders'
import SlimeYard from './SlimeYard'
import SummoningGround from './SummoningGround'

function WorldMap({
  appearingSlimeIds,
  canProduceFood,
  canSummon,
  displayedSlimes,
  dyingSlimeIds,
  foodFactoryAnimationRun,
  friendYards = [],
  foodQuantity,
  onFoodFactoryAnimationEnd,
  onFoodFactoryClick,
  onFoodDragEnd,
  onFoodDragMove,
  onFeedFriendSlime,
  onFeedSlime,
  onPokeFriendSlime,
  onRemoveSlime,
  pokedSlimeIds = [],
  onSlimeDeathAnimationEnd,
  onSlimeSummon,
  onSpritePointerDown,
  onSpritePointerUp,
  onSummoningOrbAnimationEnd,
  summoningOrbAnimationRun,
  worldView,
}) {
  const [draggedFood, setDraggedFood] = useState(null)
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
  const canDragFood = foodQuantity > 0

  function handleFoodPointerDown(event) {
    if (!canDragFood) {
      return
    }

    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggedFood({
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    })
    onFoodDragMove({ x: event.clientX, y: event.clientY })
  }

  function handleFoodPointerMove(event) {
    if (draggedFood?.pointerId !== event.pointerId) {
      return
    }

    event.stopPropagation()
    onFoodDragMove({ x: event.clientX, y: event.clientY })
    setDraggedFood((currentFood) => (
      currentFood
        ? {
            ...currentFood,
            x: event.clientX,
            y: event.clientY,
          }
        : currentFood
    ))
  }

  async function handleFoodPointerUp(event) {
    if (draggedFood?.pointerId !== event.pointerId) {
      return
    }

    event.stopPropagation()

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const slimeTarget = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-slime-id]')

    setDraggedFood(null)
    onFoodDragEnd()

    if (slimeTarget?.dataset.feedTargetType === 'friend') {
      onFeedFriendSlime({
        friendUserId: slimeTarget.dataset.feedTargetOwnerId,
        friendUsername: slimeTarget.dataset.feedTargetOwner,
        lastFedAt: slimeTarget.dataset.slimeLastFedAt,
        slimeId: slimeTarget.dataset.slimeId,
        slimeLevel: Number(slimeTarget.dataset.slimeLevel),
        slimeName: slimeTarget.dataset.slimeName,
      })
      return
    }

    if (slimeTarget) {
      await onFeedSlime(slimeTarget.dataset.slimeId)
    }
  }

  return (
    <div
      className="world-map grid bg-[#6f9552]"
      style={{
        width: worldView.columns * TILE_SIZE,
        height: worldView.rows * TILE_SIZE,
        ...getGridSizeStyle({ columns: worldView.columns, rows: worldView.rows }),
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
      {friendYards.length > 0 && (
        <FriendYardPlaceholders
          fencePosition={fencePosition}
          fenceTiles={fenceTiles}
          friends={friendYards}
          onPokeFriendSlime={onPokeFriendSlime}
          pokedSlimeIds={pokedSlimeIds}
        />
      )}
      <SlimeYard
        appearingSlimeIds={appearingSlimeIds}
        displayedSlimes={displayedSlimes}
        dyingSlimeIds={dyingSlimeIds}
        onDeathAnimationEnd={onSlimeDeathAnimationEnd}
        onRemoveSlime={onRemoveSlime}
        pokedSlimeIds={pokedSlimeIds}
        slimeYardPosition={slimeYardPosition}
      />
      <FenceOverlay fencePosition={fencePosition} fenceTiles={fenceTiles} />
      <FoodFactory
        animationRun={foodFactoryAnimationRun}
        canProduce={canProduceFood}
        foodFactoryPosition={foodFactoryPosition}
        onAnimationEnd={onFoodFactoryAnimationEnd}
        onClick={onFoodFactoryClick}
        onSpritePointerDown={onSpritePointerDown}
        onSpritePointerUp={onSpritePointerUp}
      />
      <SummoningGround
        canSummon={canSummon}
        onClick={onSlimeSummon}
        onOrbAnimationEnd={onSummoningOrbAnimationEnd}
        onSpritePointerDown={onSpritePointerDown}
        onSpritePointerUp={onSpritePointerUp}
        summoningGroundPosition={summoningGroundPosition}
        summoningOrbAnimationRun={summoningOrbAnimationRun}
      />
      <img
        className={`food-overlay${canDragFood ? ' food-overlay--draggable' : ''}`}
        src={foodSprite}
        alt="Slime food"
        role="button"
        aria-disabled={!canDragFood}
        draggable="false"
        onPointerCancel={handleFoodPointerUp}
        onPointerDown={handleFoodPointerDown}
        onPointerMove={handleFoodPointerMove}
        onPointerUp={handleFoodPointerUp}
        style={{
          width: FOOD_OVERLAY_WIDTH,
          height: FOOD_OVERLAY_HEIGHT,
          '--food-x': `${foodOverlayPosition.x}px`,
          '--food-y': `${foodOverlayPosition.y}px`,
        }}
      />
      <span
        key={`food-count-${foodQuantity}`}
        className="food-count-badge"
        aria-label={`${foodQuantity} slime food available`}
        style={{
          '--food-count-x': `${foodOverlayPosition.x + FOOD_OVERLAY_WIDTH / 2}px`,
          '--food-count-y': `${foodOverlayPosition.y - 1}px`,
        }}
      >
        {foodQuantity}
      </span>
      {draggedFood && createPortal(
        <img
          className="food-drag-preview"
          src={foodSprite}
          alt=""
          aria-hidden="true"
          draggable="false"
          style={{
            left: draggedFood.x,
            top: draggedFood.y,
          }}
        />,
        document.body,
      )}
    </div>
  )
}

export default WorldMap
