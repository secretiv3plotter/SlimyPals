import {
  foodFactoryStockRepository,
  friendshipsRepository,
  slimesRepository,
  usersRepository,
} from '../slimyPalsDb'

export async function saveRemoteDomainToCache(domain) {
  const user = domain?.user

  if (!user?.id) {
    return null
  }

  await Promise.all([
    usersRepository.upsert(toCachedUser(user, domain.serverTime)),
    domain.foodFactoryStock
      ? foodFactoryStockRepository.upsert(toCachedFoodStock(domain.foodFactoryStock, user.id))
      : Promise.resolve(null),
    ...((domain.slimes || []).map((slime) => slimesRepository.upsert(toCachedSlime(slime, user.id)))),
    ...((domain.friends || []).map((friend) => saveCachedFriend(friend, user.id))),
  ])

  return user.id
}

export function toUiDomain(domain) {
  if (!domain?.user) {
    return null
  }

  return {
    canProduceFood: domain.foodProductionReadiness?.allowed ?? false,
    foodQuantity: domain.foodFactoryStock?.quantity ?? 0,
    slimes: (domain.slimes || []).map((slime) => toCachedSlime(slime, domain.user.id)),
    user: toCachedUser(domain.user, domain.serverTime),
  }
}

function toCachedUser(user, serverTime) {
  return {
    id: user.id,
    username: user.username,
    daily_summons_left: user.dailySummonsLeft,
    max_slime_capacity: user.maxSlimeCapacity,
    last_login: user.lastDailyResetAt || serverTime || null,
    created_at: user.createdAt,
    deleted_at: user.deletedAt ?? null,
  }
}

function toCachedFoodStock(stock, userId) {
  return {
    id: stock.id,
    user_id: stock.userId || userId,
    quantity: stock.quantity,
    last_produced_at: stock.lastProducedAt ?? null,
    deleted_at: stock.deletedAt ?? null,
  }
}

function toCachedSlime(slime, fallbackUserId) {
  return {
    id: slime.id,
    user_id: slime.userId || fallbackUserId,
    rarity: slime.rarity,
    type: slime.type,
    color: slime.color,
    level: slime.level,
    last_fed_at: slime.lastFedAt ?? null,
    created_at: slime.createdAt,
    deleted_at: slime.deletedAt ?? null,
  }
}

async function saveCachedFriend(friend, userId) {
  if (!friend?.id) {
    return null
  }

  await usersRepository.upsert({
    id: friend.id,
    username: friend.username,
  })

  if (!friend.friendshipId) {
    return null
  }

  return friendshipsRepository.upsert({
    id: friend.friendshipId,
    user_id: userId,
    friend_user_id: friend.id,
    status: friend.status,
  })
}
