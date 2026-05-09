import { STORES, SYNC_ACTION_STATUSES } from '../constants'
import {
  createRecord,
  getAllRecords,
  getManyByIndex,
  getRecordById,
  hardDeleteRecord,
  updateRecord,
  upsertRecord,
} from '../records'

function sortOldestFirst(actions) {
  return [...actions].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export const pendingSyncActionsRepository = Object.freeze({
  create: (values) => createRecord(STORES.PENDING_SYNC_ACTION, values),
  upsert: (values) => upsertRecord(STORES.PENDING_SYNC_ACTION, values),
  getById: (id) => getRecordById(STORES.PENDING_SYNC_ACTION, id),
  list: async (options) => sortOldestFirst(await getAllRecords(STORES.PENDING_SYNC_ACTION, options)),
  listByStatus: async (status, options) => sortOldestFirst(
    await getManyByIndex(STORES.PENDING_SYNC_ACTION, 'by_status', status, options),
  ),
  listPending: (options) => (
    pendingSyncActionsRepository.listByStatus(SYNC_ACTION_STATUSES.PENDING, options)
  ),
  update: (id, updates) => updateRecord(STORES.PENDING_SYNC_ACTION, id, updates),
  hardDelete: (id) => hardDeleteRecord(STORES.PENDING_SYNC_ACTION, id),
})
