import foodFactorySprite from '../assets/sprites/foodfactory.png'
import {
  FOOD_FACTORY_FRAME_COUNT,
  FOOD_FACTORY_FRAME_HEIGHT,
  FOOD_FACTORY_FRAME_WIDTH,
  FOOD_FACTORY_SCALE,
} from '../game/worldConstants'

function FoodFactory({
  animationRun,
  foodFactoryPosition,
  onAnimationEnd,
  onClick,
  onSpritePointerDown,
  onSpritePointerUp,
}) {
  return (
    <button
      key={`food-factory-${animationRun}`}
      className={`food-factory${animationRun > 0 ? ' food-factory--active' : ''}`}
      type="button"
      aria-label="Produce slime food"
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
