import { STORES } from '../constants'
import { createRecord, getAllRecords, getManyByIndex, getRecordById } from '../records'

export const interactionLogsRepository = Object.freeze({
  create: (values) => createRecord(STORES.INTERACTION_LOG, values),
  getById: (id) => getRecordById(STORES.INTERACTION_LOG, id),
  listBySenderId: (senderId) => {
    return getManyByIndex(STORES.INTERACTION_LOG, 'by_sender_id', senderId)
  },
  listByTargetSlimeId: (slimeId) => {
    return getManyByIndex(STORES.INTERACTION_LOG, 'by_target_slime_id', slimeId)
  },
  list: () => getAllRecords(STORES.INTERACTION_LOG),
})
