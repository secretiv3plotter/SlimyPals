import {
  FENCE_COLUMNS,
  FENCE_ROWS,
  TILE_SIZE,
} from '../../../game/worldConstants'
import { getSlimeYardPosition } from '../../../game/worldLayout'
import FenceOverlay from './FenceOverlay'
import SlimeYard from './SlimeYard'

const HORIZONTAL_FRIEND_YARD_GAP_TILES = 4
const VERTICAL_FRIEND_YARD_GAP_TILES = 2
const FRIEND_YARD_POSITIONS = Object.freeze(['top', 'right', 'bottom', 'left'])

function FriendYardPlaceholders({ fencePosition, fenceTiles, friends = [] }) {
  return (
    <>
      {friends.slice(0, FRIEND_YARD_POSITIONS.length).map((friend, index) => {
        const position = FRIEND_YARD_POSITIONS[index]
        const friendFencePosition = getFriendFencePosition(fencePosition, position)

        return (
          <div className="friend-yard-placeholder" key={friend.id || position}>
            <div
              className="friend-yard-label"
              style={{
                left: friendFencePosition.x + (FENCE_COLUMNS * TILE_SIZE) / 2,
                top: friendFencePosition.y - TILE_SIZE,
              }}
            >
              {friend.username}'s yard
            </div>
            <SlimeYard
              canRemoveSlimes={false}
              displayedSlimes={friend.slimes ?? []}
              feedTargetOwner={friend.username}
              feedTargetOwnerId={friend.id}
              feedTargetType="friend"
              slimeYardPosition={getSlimeYardPosition(friendFencePosition)}
            />
            <FenceOverlay
              fencePosition={friendFencePosition}
              fenceTiles={fenceTiles}
            />
          </div>
        )
      })}
    </>
  )
}

function getFriendFencePosition(fencePosition, position) {
  const horizontalOffset = (FENCE_COLUMNS + HORIZONTAL_FRIEND_YARD_GAP_TILES) * TILE_SIZE
  const verticalOffset = (FENCE_ROWS + VERTICAL_FRIEND_YARD_GAP_TILES) * TILE_SIZE

  if (position === 'top') {
    return {
      x: fencePosition.x,
      y: fencePosition.y - verticalOffset,
    }
  }

  if (position === 'bottom') {
    return {
      x: fencePosition.x,
      y: fencePosition.y + verticalOffset,
    }
  }

  if (position === 'left') {
    return {
      x: fencePosition.x - horizontalOffset,
      y: fencePosition.y,
    }
  }

  return {
    x: fencePosition.x + horizontalOffset,
    y: fencePosition.y,
  }
}

export default FriendYardPlaceholders
