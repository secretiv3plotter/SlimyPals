import {
  GAME_LIMITS,
  INTERACTION_TYPES,
  SLIME_LEVELS,
  SLIME_RARITIES,
} from '../../../infrastructure/db'

export const FEED_COOLDOWN_HOURS = 6
export const FEED_COOLDOWN_MS = FEED_COOLDOWN_HOURS * 60 * 60 * 1000

export const SLIME_TYPES_BY_RARITY = Object.freeze({
  [SLIME_RARITIES.COMMON]: ['simple'],
  [SLIME_RARITIES.RARE]: ['baseball', 'beanie', 'fedora'],
  [SLIME_RARITIES.MYTHICAL]: ['demon', 'king', 'witch'],
})

export const SUMMON_RARITY_TABLE = Object.freeze([
  { rarity: SLIME_RARITIES.COMMON, weight: 60 },
  { rarity: SLIME_RARITIES.RARE, weight: 35 },
  { rarity: SLIME_RARITIES.MYTHICAL, weight: 5 },
])

export const COMMON_SLIME_COLORS = Object.freeze([
  { name: 'red', hex: '#d94b4b' },
  { name: 'orange', hex: '#e48a3a' },
  { name: 'yellow', hex: '#e2c84a' },
  { name: 'green', hex: '#58b56b' },
  { name: 'blue', hex: '#4d8fd9' },
  { name: 'purple', hex: '#9661c7' },
  { name: 'pink', hex: '#d96aa4' },
])

export function canSummonSlime({ user, activeSlimeCount }) {
  const maxCapacity = user?.max_slime_capacity ?? GAME_LIMITS.MAX_SLIMES

  if (!user || user.deleted_at) {
    return failedRule('USER_UNAVAILABLE', 'A slime can only be summoned for an active user.')
  }

  if ((user.daily_summons_left ?? 0) <= 0) {
    return failedRule('DAILY_SUMMON_LIMIT_REACHED', 'The user has no daily summons left.')
  }

  if (activeSlimeCount >= maxCapacity) {
    return failedRule('DOMAIN_CAPACITY_REACHED', 'The user domain is already at slime capacity.')
  }

  return passedRule()
}

export function createSummonedSlimeDraft({ userId, random = Math.random, now = new Date() }) {
  const rarity = pickWeightedRarity(random)
  const slimeColor = pickSlimeColor(random)
  const type = rarity === SLIME_RARITIES.COMMON
    ? slimeColor.name
    : pickSlimeType(rarity, random)

  return {
    user_id: userId,
    rarity,
    type,
    color: slimeColor.hex,
    level: SLIME_LEVELS.BABY,
    last_fed_at: null,
    created_at: now.toISOString(),
    deleted_at: null,
  }
}

export function canFeedSlime({ slime, foodStock, now = new Date() }) {
  if (!slime || slime.deleted_at) {
    return failedRule('SLIME_UNAVAILABLE', 'Only an active slime can be fed.')
  }

  if (slime.level >= SLIME_LEVELS.ADULT) {
    return failedRule('SLIME_ALREADY_ADULT', 'This slime has reached 100% of its potential!')
  }

  if (!foodStock || foodStock.deleted_at || foodStock.quantity <= 0) {
    return failedRule('NO_FOOD_AVAILABLE', 'Feeding requires at least one slime food.')
  }

  if (!isFeedWindowOpen(slime, now)) {
    return failedRule(
      'FEED_COOLDOWN_ACTIVE',
      `This slime is not hungry yet. Try again in ${formatRemainingCooldown(slime, now)}.`,
    )
  }

  return passedRule()
}

export function canRemoveSlime({ slime, userId }) {
  if (!slime || slime.deleted_at) {
    return failedRule('SLIME_UNAVAILABLE', 'Only an active slime can be removed.')
  }

  if (slime.user_id !== userId) {
    return failedRule('SLIME_OWNER_MISMATCH', 'Only the owner can remove this slime.')
  }

  return passedRule()
}

export function canProduceSlimeFood({ user, foodStock, activeSlimeCount, now = new Date() }) {
  if (!user || user.deleted_at) {
    return failedRule('USER_UNAVAILABLE', 'Food can only be produced for an active user.')
  }

  if (activeSlimeCount <= 0) {
    return failedRule('NO_ACTIVE_SLIMES', 'The food factory needs active slimes to determine output.')
  }

  if (foodStock?.last_produced_at && isSameLocalDay(foodStock.last_produced_at, now)) {
    return failedRule('FOOD_ALREADY_PRODUCED_TODAY', 'The food factory has already produced today.')
  }

  if ((foodStock?.quantity ?? 0) >= GAME_LIMITS.MAX_FOOD_STOCK) {
    return failedRule('FOOD_STOCK_FULL', 'The food stock is already at its max capacity.')
  }

  return passedRule()
}

export function getNextSlimeLevel(level) {
  return Math.min(level + 1, SLIME_LEVELS.ADULT)
}

export function isFeedWindowOpen(slime, now = new Date()) {
  if (!slime.last_fed_at) {
    return true
  }

  return new Date(now).getTime() - new Date(slime.last_fed_at).getTime() >= FEED_COOLDOWN_MS
}

export function getNextFeedAt(slime) {
  if (!slime.last_fed_at || slime.level >= SLIME_LEVELS.ADULT) {
    return null
  }

  return new Date(new Date(slime.last_fed_at).getTime() + FEED_COOLDOWN_MS).toISOString()
}

export function getRemainingFeedCooldown(slime, now = new Date()) {
  if (!slime.last_fed_at) {
    return 0
  }

  const nextFeedAt = new Date(slime.last_fed_at).getTime() + FEED_COOLDOWN_MS

  return Math.max(0, nextFeedAt - new Date(now).getTime())
}

export function formatRemainingCooldown(slime, now = new Date()) {
  return formatDuration(getRemainingFeedCooldown(slime, now))
}

export function getFoodProductionAmount(activeSlimeCount, currentFoodQuantity = 0) {
  const remainingCapacity = Math.max(0, GAME_LIMITS.MAX_FOOD_STOCK - currentFoodQuantity)
  return Math.min(Math.max(0, activeSlimeCount), remainingCapacity)
}

export function createInteractionLogDraft({ senderId, targetSlimeId, actionType, now = new Date() }) {
  return {
    sender_id: senderId,
    target_slime_id: targetSlimeId,
    action_type: actionType,
    created_at: now.toISOString(),
  }
}

export function isFeedInteraction(actionType) {
  return actionType === INTERACTION_TYPES.FEED
}

function pickWeightedRarity(random) {
  const totalWeight = SUMMON_RARITY_TABLE.reduce((total, entry) => total + entry.weight, 0)
  let roll = random() * totalWeight

  for (const entry of SUMMON_RARITY_TABLE) {
    roll -= entry.weight

    if (roll <= 0) {
      return entry.rarity
    }
  }

  return SUMMON_RARITY_TABLE.at(-1).rarity
}

function pickSlimeType(rarity, random) {
  const types = SLIME_TYPES_BY_RARITY[rarity]
  const index = Math.min(Math.floor(random() * types.length), types.length - 1)
  return types[index]
}

function pickSlimeColor(random) {
  const index = Math.min(
    Math.floor(random() * COMMON_SLIME_COLORS.length),
    COMMON_SLIME_COLORS.length - 1,
  )
  return COMMON_SLIME_COLORS[index]
}

function isSameLocalDay(leftDate, rightDate) {
  const left = new Date(leftDate)
  const right = new Date(rightDate)

  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  )
}

function passedRule() {
  return { allowed: true, reason: null, message: null }
}

function failedRule(reason, message) {
  return { allowed: false, reason, message }
}

function formatDuration(durationMs) {
  const totalMinutes = Math.max(1, Math.ceil(durationMs / (60 * 1000)))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) {
    return `${minutes}m`
  }

  if (minutes <= 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}
