import summoningGroundSprite from '../../../assets/sprites/summoningground.png'
import summoningOrbSprite from '../../../assets/sprites/summoningorb.png'
import {
  SUMMONING_GROUND_FRAME_COUNT,
  SUMMONING_GROUND_FRAME_HEIGHT,
  SUMMONING_GROUND_FRAME_WIDTH,
  SUMMONING_GROUND_SCALE,
} from '../../../game/worldConstants'

function SummoningGround({
  canSummon,
  onClick,
  onOrbAnimationEnd,
  onSpritePointerDown,
  onSpritePointerUp,
  summoningGroundPosition,
  summoningOrbAnimationRun,
}) {
  return (
    <button
      className={`summoning-ground${canSummon ? '' : ' summoning-ground--disabled'}`}
      type="button"
      aria-label="Summon slime"
      aria-disabled={!canSummon}
      onClick={onClick}
      onPointerCancel={onSpritePointerUp}
      onPointerDown={onSpritePointerDown}
      onPointerUp={onSpritePointerUp}
      style={{
        '--summoning-ground-frame-count': SUMMONING_GROUND_FRAME_COUNT,
        '--summoning-ground-frame-height': `${SUMMONING_GROUND_FRAME_HEIGHT}px`,
        '--summoning-ground-frame-width': `${SUMMONING_GROUND_FRAME_WIDTH}px`,
        '--summoning-ground-scale': SUMMONING_GROUND_SCALE,
        backgroundImage: `url(${summoningGroundSprite})`,
        transform: `translate(${summoningGroundPosition.x}px, ${summoningGroundPosition.y}px)`,
      }}
    >
      {summoningOrbAnimationRun > 0 && (
        <span
          key={`summoning-orb-${summoningOrbAnimationRun}`}
          className="summoning-orb summoning-orb--active"
          aria-hidden="true"
          onAnimationEnd={onOrbAnimationEnd}
          style={{
            backgroundImage: `url(${summoningOrbSprite})`,
          }}
        />
      )}
    </button>
  )
}

export default SummoningGround
