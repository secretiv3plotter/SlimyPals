import {
  SLIME_YARD_COLUMNS,
  SLIME_YARD_ROWS,
  TILE_SIZE,
} from '../layout/worldConstants'
import { getGridSizeStyle } from '../layout/mapTiles'
import YardSlime from './YardSlime'

function SlimeYard({
  appearingSlimeIds = [],
  canRemoveSlimes = true,
  displayedSlimes,
  dyingSlimeIds = [],
  feedTargetOwner = null,
  feedTargetOwnerId = null,
  feedTargetType = 'own',
  isFeedTarget = true,
  onDeathAnimationEnd,
  onPokeFriendSlime,
  onRemoveSlime,
  pokedSlimeIds = [],
  slimeYardPosition,
}) {
  return (
    <>
      <div
        className="slime-yard-zone grid"
        aria-hidden="true"
        style={{
          width: SLIME_YARD_COLUMNS * TILE_SIZE,
          height: SLIME_YARD_ROWS * TILE_SIZE,
          ...getGridSizeStyle({ columns: SLIME_YARD_COLUMNS, rows: SLIME_YARD_ROWS }),
          left: slimeYardPosition.x,
          top: slimeYardPosition.y,
        }}
      >
        {Array.from({ length: SLIME_YARD_COLUMNS * SLIME_YARD_ROWS }, (_, index) => (
          <div className="slime-yard-tile" key={index} />
        ))}
      </div>
      <div
        className="slime-yard-slimes"
        aria-label="Summoned slimes"
        style={{
          width: SLIME_YARD_COLUMNS * TILE_SIZE,
          height: SLIME_YARD_ROWS * TILE_SIZE,
          left: slimeYardPosition.x,
          top: slimeYardPosition.y,
        }}
      >
        {displayedSlimes.map((slime) => (
          <YardSlime
            key={slime.id}
            canRemoveSlimes={canRemoveSlimes}
            feedTargetOwner={feedTargetOwner}
            feedTargetOwnerId={feedTargetOwnerId}
            feedTargetType={feedTargetType}
            isAppearing={appearingSlimeIds.includes(slime.id)}
            isFeedTarget={isFeedTarget}
            isDying={dyingSlimeIds.includes(slime.id)}
            onDeathAnimationEnd={onDeathAnimationEnd}
            onPokeFriendSlime={onPokeFriendSlime}
            onRemoveSlime={onRemoveSlime}
            pokeRun={pokedSlimeIds.filter((pokedSlimeId) => pokedSlimeId === slime.id).length}
            slimeDepthOffsetY={slimeYardPosition.y}
            slime={slime}
          />
        ))}
      </div>
    </>
  )
}

export default SlimeYard
