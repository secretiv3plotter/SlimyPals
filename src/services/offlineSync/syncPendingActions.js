import { syncActions } from '../slimyPalsApi'
import {
  pendingSyncActionsRepository,
  SYNC_ACTION_STATUSES,
} from '../slimyPalsDb'
import {
  getActionResultErrorCode,
  getActionResultId,
  getActionResultStatus,
  toApiSyncAction,
} from './actionPayloads'

export async function syncPendingActions({ clientId } = {}) {
  const pendingActions = await pendingSyncActionsRepository.listPending()

  if (pendingActions.length === 0) {
    return { accepted: [], rejected: [], synced: [] }
  }

  await Promise.all(pendingActions.map(markSyncing))

  try {
    const response = await syncActions({
      actions: pendingActions.map(toApiSyncAction),
      clientId,
    })
    return applySyncResults(response, pendingActions)
  } catch (error) {
    await Promise.all(pendingActions.map((action) => markPendingAfterFailure(action, error)))
    throw error
  }
}

async function applySyncResults(response, pendingActions) {
  const results = getResponseActionResults(response)
  const resultById = new Map(results.map((result) => [getActionResultId(result), result]))
  const accepted = []
  const rejected = []

  await Promise.all(pendingActions.map(async (action) => {
    const result = resultById.get(action.id)

    if (!result) {
      await markPendingWithError(action, 'SYNC_RESULT_MISSING')
      return
    }

    const status = getActionResultStatus(result)

    if (status === SYNC_ACTION_STATUSES.REJECTED) {
      rejected.push(await markRejected(action, getActionResultErrorCode(result)))
      return
    }

    if (status === SYNC_ACTION_STATUSES.ACCEPTED) {
      accepted.push(await markAccepted(action))
      return
    }

    await markPendingWithError(action, 'UNKNOWN_SYNC_RESULT_STATUS')
  }))

  return { accepted, rejected, synced: [...accepted, ...rejected] }
}

function getResponseActionResults(response) {
  if (response?.accepted || response?.rejected) {
    return [
      ...(response.accepted || []).map((result) => ({
        ...result,
        status: SYNC_ACTION_STATUSES.ACCEPTED,
      })),
      ...(response.rejected || []).map((result) => ({
        ...result,
        status: SYNC_ACTION_STATUSES.REJECTED,
      })),
    ]
  }

  return response?.actions || response?.results || []
}

function markSyncing(action) {
  return pendingSyncActionsRepository.update(action.id, {
    attempt_count: action.attempt_count + 1,
    last_attempted_at: new Date().toISOString(),
    last_error_code: null,
    status: SYNC_ACTION_STATUSES.SYNCING,
  })
}

function markPendingAfterFailure(action, error) {
  return markPendingWithError(action, error?.code || 'SYNC_FAILED')
}

function markPendingWithError(action, errorCode) {
  return pendingSyncActionsRepository.update(action.id, {
    last_error_code: errorCode,
    status: SYNC_ACTION_STATUSES.PENDING,
  })
}

function markAccepted(action) {
  return pendingSyncActionsRepository.update(action.id, {
    last_error_code: null,
    status: SYNC_ACTION_STATUSES.ACCEPTED,
  })
}

function markRejected(action, errorCode) {
  return pendingSyncActionsRepository.update(action.id, {
    last_error_code: errorCode || 'SYNC_ACTION_REJECTED',
    status: SYNC_ACTION_STATUSES.REJECTED,
  })
}
