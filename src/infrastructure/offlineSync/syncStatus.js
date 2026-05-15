import { SYNC_ACTION_STATUSES } from '../db'

export function isQueuedAction(action) {
  return action?.status === SYNC_ACTION_STATUSES.PENDING
}

export function isTerminalSyncStatus(status) {
  return [
    SYNC_ACTION_STATUSES.ACCEPTED,
    SYNC_ACTION_STATUSES.REJECTED,
  ].includes(status)
}

export { SYNC_ACTION_STATUSES }
