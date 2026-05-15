import { foodFactoryStockRepository, slimesRepository } from '../db'
import {
  CLIENT_REALTIME_EVENTS,
  SERVER_REALTIME_EVENTS,
} from './realtimeEvents'

export function createDomainSubscribeEvent(friendUserId) {
  return {
    type: CLIENT_REALTIME_EVENTS.DOMAIN_SUBSCRIBE,
    payload: { friendUserId },
  }
}

export function createDomainUnsubscribeEvent(friendUserId) {
  return {
    type: CLIENT_REALTIME_EVENTS.DOMAIN_UNSUBSCRIBE,
    payload: { friendUserId },
  }
}

export function isDomainEvent(event) {
  return [
    SERVER_REALTIME_EVENTS.DOMAIN_SLIME_CREATED,
    SERVER_REALTIME_EVENTS.DOMAIN_SLIME_UPDATED,
    SERVER_REALTIME_EVENTS.DOMAIN_SLIME_DELETED,
    SERVER_REALTIME_EVENTS.DOMAIN_FOOD_UPDATED,
  ].includes(event?.type)
}

export async function cacheDomainEvent(event) {
  const payload = event?.payload || {}

  if (event.type === SERVER_REALTIME_EVENTS.DOMAIN_FOOD_UPDATED && payload.foodFactoryStock) {
    return foodFactoryStockRepository.upsert(toCachedFoodStock(payload.foodFactoryStock))
  }

  if (!payload.slime) {
    return null
  }

  return slimesRepository.upsert(toCachedSlime(payload.slime))
}

function toCachedFoodStock(stock) {
  return {
    id: stock.id,
    user_id: stock.userId,
    quantity: stock.quantity,
    last_produced_at: stock.lastProducedAt ?? null,
    deleted_at: stock.deletedAt ?? null,
  }
}

function toCachedSlime(slime) {
  return {
    id: slime.id,
    user_id: slime.userId,
    rarity: slime.rarity,
    type: slime.type,
    color: slime.color,
    level: slime.level,
    last_fed_at: slime.lastFedAt ?? null,
    created_at: slime.createdAt,
    deleted_at: slime.deletedAt ?? null,
  }
}
