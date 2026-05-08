import { useMemo } from 'react'
import foodSprite from '../assets/sprites/food.png'
import { createFenceTiles, createTileGrid, getGridSizeStyle } from '../game/mapTiles'
import {
  FOOD_OVERLAY_HEIGHT,
  FOOD_OVERLAY_WIDTH,
  TILE_SIZE,
} from '../game/worldConstants'
import {
  getFencePosition,
  getFoodFactoryPosition,
  getFoodOverlayPosition,
  getSlimeYardPosition,
  getSummoningGroundPosition,
} from '../game/worldLayout'
import FenceOverlay from './FenceOverlay'
import FoodFactory from './FoodFactory'
import SlimeYard from './SlimeYard'
import SummoningGround from './SummoningGround'

function WorldMap({
  canSummon,
  displayedSlimes,
  foodFactoryAnimationRun,
  onFoodFactoryAnimationEnd,
  onFoodFactoryClick,
  onSlimeSummon,
  onSpritePointerDown,
  onSpritePointerUp,
  onSummoningOrbAnimationEnd,
  summoningOrbAnimationRun,
  worldView,
}) {
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
      <div className="map-tint-layer" />
      <SlimeYard
        displayedSlimes={displayedSlimes}
        slimeYardPosition={slimeYardPosition}
      />
      <FenceOverlay fencePosition={fencePosition} fenceTiles={fenceTiles} />
      <FoodFactory
        animationRun={foodFactoryAnimationRun}
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
  )
}

export default WorldMap
