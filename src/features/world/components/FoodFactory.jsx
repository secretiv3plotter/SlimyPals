import foodFactoryShadowSprite from '../../../assets/foodfactory/foodfactory-shadow.png'
import foodFactorySprite from '../../../assets/foodfactory/foodfactory.png'
import {
  FOOD_FACTORY_FRAME_COUNT,
  FOOD_FACTORY_FRAME_HEIGHT,
  FOOD_FACTORY_FRAME_WIDTH,
  FOOD_FACTORY_SCALE,
} from '../../../game/worldConstants'

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
  const isReady = canProduce && !isAnimating

  const styleProps = {
    '--food-factory-frame-count': FOOD_FACTORY_FRAME_COUNT,
    '--food-factory-frame-height': `${FOOD_FACTORY_FRAME_HEIGHT}px`,
    '--food-factory-frame-width': `${FOOD_FACTORY_FRAME_WIDTH}px`,
    '--food-factory-scale': FOOD_FACTORY_SCALE,
    transform: `translate(${foodFactoryPosition.x}px, ${foodFactoryPosition.y}px)`,
    zIndex: Math.round(foodFactoryPosition.y + FOOD_FACTORY_FRAME_HEIGHT * FOOD_FACTORY_SCALE),
  }

  const spriteStyle = {
    '--food-factory-frame-count': FOOD_FACTORY_FRAME_COUNT,
    '--food-factory-frame-height': `${FOOD_FACTORY_FRAME_HEIGHT}px`,
    '--food-factory-frame-width': `${FOOD_FACTORY_FRAME_WIDTH}px`,
    '--food-factory-scale': FOOD_FACTORY_SCALE,
    '--factory-image': `url(${foodFactorySprite})`,
    '--shadow-image': `url(${foodFactoryShadowSprite})`,
  }

  return (
    <div
      className="food-factory-container"
      style={styleProps}
    >
      {/* 1. The Shadow */}
      <div
        className={`food-factory-shadow${isAnimating ? ' food-factory-shadow--active' : ''}`}
        style={{
          ...spriteStyle,
          backgroundImage: 'var(--shadow-image)',
        }}
      />

      {/* 2. The Visual Building (Handles full animation without clipping) */}
      <div
        key={`food-factory-visual-${animationRun}`}
        className={`food-factory-visual${isAnimating ? ' food-factory-visual--active' : ''}${isReady ? ' food-factory-visual--ready' : ''}${!canProduce && !isAnimating ? ' food-factory-visual--disabled' : ''}`}
        onAnimationEnd={onAnimationEnd}
        style={{
          ...spriteStyle,
          backgroundImage: 'var(--factory-image)',
        }}
      />

      {/* 3. The Invisible Hitbox (Handles alpha-aware clicks) */}
      <button
        className="food-factory-hitbox"
        type="button"
        aria-label="Produce slime food"
        aria-disabled={!canProduce}
        disabled={isAnimating}
        onClick={onClick}
        onPointerCancel={onSpritePointerUp}
        onPointerDown={onSpritePointerDown}
        onPointerUp={onSpritePointerUp}
        style={{
          ...spriteStyle,
          '--hitbox-mask': 'var(--shadow-image)',
        }}
      />
    </div>
  )
}

export default FoodFactory
