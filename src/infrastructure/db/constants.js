export const DB_NAME = 'slimy-pals'
export const DB_VERSION = 3

export const STORES = Object.freeze({
  USER: 'user',
  FOOD_FACTORY_STOCK: 'food_factory_stock',
  FRIENDSHIP: 'friendship',
  SLIME: 'slime',
  INTERACTION_LOG: 'interaction_log',
  PENDING_SYNC_ACTION: 'pending_sync_action',
})

export const GAME_LIMITS = Object.freeze({
  DAILY_SUMMONS: 9,
  MAX_SLIMES: 25,
  MAX_FOOD_STOCK: 100,
  MAX_FRIENDS: 4,
})

export const SLIME_RARITIES = Object.freeze({
  COMMON: 'Common',
  RARE: 'Rare',
  MYTHICAL: 'Mythical',
})

export const SLIME_LEVELS = Object.freeze({
  BABY: 1,
  TEEN: 2,
  ADULT: 3,
})

export const FRIENDSHIP_STATUSES = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
})

export const INTERACTION_TYPES = Object.freeze({
  POKE: 'poke',
  FEED: 'feed',
})

export const SYNC_ACTION_STATUSES = Object.freeze({
  PENDING: 'pending',
  SYNCING: 'syncing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
})

export const SYNC_ACTION_TYPES = Object.freeze({
  SUMMON_SLIME: 'summonSlime',
  PRODUCE_FOOD: 'produceFood',
  FEED_OWN_SLIME: 'feedOwnSlime',
  FEED_FRIEND_SLIME: 'feedFriendSlime',
  POKE_FRIEND_SLIME: 'pokeFriendSlime',
  DELETE_OWN_SLIME: 'deleteOwnSlime',
})
