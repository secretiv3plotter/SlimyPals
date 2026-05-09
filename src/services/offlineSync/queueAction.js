import {
  pendingSyncActionsRepository,
  SYNC_ACTION_TYPES,
} from '../slimyPalsDb'

export function queueAction({ payload = {}, type }) {
  return pendingSyncActionsRepository.create({
    payload,
    type,
  })
}

export function queueSummonSlime({ userId, slimeId }) {
  return queueAction({
    type: SYNC_ACTION_TYPES.SUMMON_SLIME,
    payload: { slimeId, userId },
  })
}

export function queueProduceFood({ producedQuantity, userId }) {
  return queueAction({
    type: SYNC_ACTION_TYPES.PRODUCE_FOOD,
    payload: { producedQuantity, userId },
  })
}

export function queueFeedOwnSlime({ slimeId, userId }) {
  return queueAction({
    type: SYNC_ACTION_TYPES.FEED_OWN_SLIME,
    payload: { slimeId, userId },
  })
}

export function queueFeedFriendSlime({ friendUserId, slimeId, userId }) {
  return queueAction({
    type: SYNC_ACTION_TYPES.FEED_FRIEND_SLIME,
    payload: { friendUserId, slimeId, userId },
  })
}

export function queuePokeFriendSlime({ friendUserId, slimeId, userId }) {
  return queueAction({
    type: SYNC_ACTION_TYPES.POKE_FRIEND_SLIME,
    payload: { friendUserId, slimeId, userId },
  })
}

export function queueDeleteOwnSlime({ slimeId, userId }) {
  return queueAction({
    type: SYNC_ACTION_TYPES.DELETE_OWN_SLIME,
    payload: { slimeId, userId },
  })
}
