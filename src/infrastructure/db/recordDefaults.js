import {
  FRIENDSHIP_STATUSES,
  GAME_LIMITS,
  SLIME_LEVELS,
  STORES,
  SYNC_ACTION_STATUSES,
} from './constants'
import { nowIso } from './time'
import { createUuid } from './uuid'

export function applyRecordDefaults(storeName, values = {}) {
  const now = nowIso()
  const id = values.id || createUuid()
  const baseRecord = {
    id,
    created_at: values.created_at || now,
    deleted_at: values.deleted_at ?? null,
  }

  if (storeName === STORES.USER) {
    return {
      ...baseRecord,
      daily_summons_left: GAME_LIMITS.DAILY_SUMMONS,
      max_slime_capacity: GAME_LIMITS.MAX_SLIMES,
      last_login: null,
      ...values,
      id,
    }
  }

  if (storeName === STORES.FOOD_FACTORY_STOCK) {
    return {
      ...baseRecord,
      quantity: 0,
      last_produced_at: null,
      ...values,
      id,
    }
  }

  if (storeName === STORES.FRIENDSHIP) {
    return {
      ...baseRecord,
      status: FRIENDSHIP_STATUSES.PENDING,
      ...values,
      id,
    }
  }

  if (storeName === STORES.SLIME) {
    return {
      ...baseRecord,
      level: SLIME_LEVELS.BABY,
      last_fed_at: null,
      ...values,
      id,
    }
  }

  if (storeName === STORES.INTERACTION_LOG) {
    return {
      id,
      created_at: values.created_at || now,
      ...values,
    }
  }

  if (storeName === STORES.PENDING_SYNC_ACTION) {
    return {
      ...baseRecord,
      payload: {},
      status: SYNC_ACTION_STATUSES.PENDING,
      attempt_count: 0,
      last_error_code: null,
      last_attempted_at: null,
      ...values,
      id,
    }
  }

  return {
    ...baseRecord,
    ...values,
    id,
  }
}
