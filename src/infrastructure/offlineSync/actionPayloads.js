import {
  slimesRepository,
  SYNC_ACTION_TYPES,
} from '../db'

export async function toApiSyncAction(action) {
  return {
    clientActionId: action.id,
    type: action.type,
    payload: await getActionPayload(action),
    createdAt: action.created_at,
  }
}

async function getActionPayload(action) {
  if (action.type !== SYNC_ACTION_TYPES.SUMMON_SLIME || action.payload?.slime) {
    return action.payload
  }

  const slimeId = action.payload?.slimeId
  const slime = slimeId ? await slimesRepository.getById(slimeId) : null

  return {
    ...action.payload,
    slime: slime || undefined,
  }
}

export function getActionResultId(result) {
  return result?.clientActionId || result?.id || result?.client_action_id
}

export function getActionResultStatus(result) {
  return result?.status || (result?.accepted ? 'accepted' : null)
}

export function getActionResultErrorCode(result) {
  return result?.error?.code || result?.errorCode || result?.error_code || null
}

export function getActionResultRealtimeEvents(result) {
  return Array.isArray(result?.realtimeEvents)
    ? result.realtimeEvents
    : []
}
