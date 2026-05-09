import summoningFireSprite from '../../../assets/sprites/fire.png'
import summoningGroundSprite from '../../../assets/sprites/ground.png'
import summoningGroundShadowSprite from '../../../assets/sprites/ground_shadow.png'
import summoningOrbSprite from '../../../assets/sprites/orb.png'
import summoningOrbShadowSprite from '../../../assets/sprites/orb_shadow.png'
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
        transform: `translate(${summoningGroundPosition.x}px, ${summoningGroundPosition.y}px)`,
      }}
    >
      <span
        className="summoning-layer summoning-layer--ground-shadow"
        aria-hidden="true"
        style={{ backgroundImage: `url(${summoningGroundShadowSprite})` }}
      />
      <span
        className="summoning-layer summoning-layer--ground"
        aria-hidden="true"
        style={{ backgroundImage: `url(${summoningGroundSprite})` }}
      />
      <span
        className="summoning-layer summoning-layer--fire"
        aria-hidden="true"
        style={{ backgroundImage: `url(${summoningFireSprite})` }}
      />
      {summoningOrbAnimationRun > 0 && (
        <>
          <span
            key={`summoning-orb-shadow-${summoningOrbAnimationRun}`}
            className="summoning-layer summoning-layer--orb-shadow summoning-orb--active"
            aria-hidden="true"
            style={{
              backgroundImage: `url(${summoningOrbShadowSprite})`,
            }}
          />
          <span
            key={`summoning-orb-${summoningOrbAnimationRun}`}
            className="summoning-layer summoning-layer--orb summoning-orb--active"
            aria-hidden="true"
            onAnimationEnd={onOrbAnimationEnd}
            style={{
              backgroundImage: `url(${summoningOrbSprite})`,
            }}
          />
        </>
      )}
    </button>
  )
}

export default SummoningGround
