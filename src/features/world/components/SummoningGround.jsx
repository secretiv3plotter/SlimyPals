import fireSprite from '../../../assets/summon/fire.png'
import groundShadowSprite from '../../../assets/summon/groundshadow.png'
import orbShadowSprite from '../../../assets/summon/orbshadow.png'
import summoningGroundSprite from '../../../assets/summon/summoningground.png'
import summoningOrbSprite from '../../../assets/summon/summoningorb.png'
import {
  SUMMONING_GROUND_FRAME_COUNT,
  SUMMONING_GROUND_FRAME_HEIGHT,
  SUMMONING_GROUND_FRAME_WIDTH,
  SUMMONING_GROUND_SCALE,
  SUMMONING_ORB_FRAME_COUNT,
  SUMMONING_ORB_FRAME_HEIGHT,
  SUMMONING_ORB_FRAME_WIDTH,
  SUMMONING_ORB_SCALE,
} from '../layout/worldConstants'

function SummoningGround({
  canSummon,
  onClick,
  onOrbAnimationEnd,
  onSpritePointerDown,
  onSpritePointerUp,
  summoningGroundPosition,
  summoningOrbAnimationRun,
}) {
  const isActivated = summoningOrbAnimationRun > 0
  const isReady = canSummon && !isActivated

  const commonVars = {
    '--summoning-ground-frame-count': SUMMONING_GROUND_FRAME_COUNT,
    '--summoning-ground-frame-height': `${SUMMONING_GROUND_FRAME_HEIGHT}px`,
    '--summoning-ground-frame-width': `${SUMMONING_GROUND_FRAME_WIDTH}px`,
    '--summoning-ground-scale': SUMMONING_GROUND_SCALE,
  }

  const orbVars = {
    '--summoning-ground-frame-count': SUMMONING_ORB_FRAME_COUNT,
    '--summoning-ground-frame-height': `${SUMMONING_ORB_FRAME_HEIGHT}px`,
    '--summoning-ground-frame-width': `${SUMMONING_ORB_FRAME_WIDTH}px`,
    '--summoning-ground-scale': SUMMONING_ORB_SCALE,
  }

  return (
    <div
      className={`summoning-container${isReady ? ' summoning-container--ready' : ''}`}
      style={{
        transform: `translate(${summoningGroundPosition.x}px, ${summoningGroundPosition.y}px)`,
        width: `${SUMMONING_GROUND_FRAME_WIDTH * SUMMONING_GROUND_SCALE}px`,
        height: `${SUMMONING_GROUND_FRAME_HEIGHT * SUMMONING_GROUND_SCALE}px`,
      }}
    >
      <span
        className="summoning-layer summoning-ground-shadow"
        style={{ ...commonVars, backgroundImage: `url(${groundShadowSprite})` }}
      />

      {isActivated && (
        <span
          key={`orb-shadow-${summoningOrbAnimationRun}`}
          className="summoning-layer summoning-orb-shadow"
          style={{ ...orbVars, backgroundImage: `url(${orbShadowSprite})` }}
        />
      )}

      <span
        className="summoning-layer summoning-ground-base"
        style={{ ...commonVars, backgroundImage: `url(${summoningGroundSprite})` }}
      />

      <span
        className="summoning-layer summoning-fire"
        style={{ ...commonVars, backgroundImage: `url(${fireSprite})` }}
      />

      {isActivated && (
        <span
          key={`orb-${summoningOrbAnimationRun}`}
          className="summoning-layer summoning-orb-active"
          onAnimationEnd={onOrbAnimationEnd}
          style={{ ...orbVars, backgroundImage: `url(${summoningOrbSprite})` }}
        />
      )}

      <button
        className={`summoning-hitbox${canSummon ? '' : ' summoning-hitbox--disabled'}`}
        type="button"
        aria-label="Summon slime"
        onClick={onClick}
        onPointerCancel={onSpritePointerUp}
        onPointerDown={onSpritePointerDown}
        onPointerUp={onSpritePointerUp}
      />
    </div>
  )
}

export default SummoningGround
