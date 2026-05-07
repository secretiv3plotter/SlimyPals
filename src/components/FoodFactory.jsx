import foodFactorySprite from '../assets/sprites/foodfactory.png'
import {
  FOOD_FACTORY_FRAME_COUNT,
  FOOD_FACTORY_FRAME_HEIGHT,
  FOOD_FACTORY_FRAME_WIDTH,
  FOOD_FACTORY_SCALE,
} from '../game/worldConstants'

function FoodFactory({
  animationRun,
  canProduce,
  foodFactoryPosition,
  onAnimationEnd,
  onClick,
  onSpritePointerDown,
  onSpritePointerUp,
}) {
  const isAnimating = animationRun > 0

  return (
    <button
      key={`food-factory-${animationRun}`}
      className={`food-factory${isAnimating ? ' food-factory--active' : ''}${!canProduce && !isAnimating ? ' food-factory--disabled' : ''}`}
      type="button"
      aria-label="Produce slime food"
      disabled={!canProduce || isAnimating}
      onAnimationEnd={onAnimationEnd}
      onClick={onClick}
      onPointerCancel={onSpritePointerUp}
      onPointerDown={onSpritePointerDown}
      onPointerUp={onSpritePointerUp}
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
