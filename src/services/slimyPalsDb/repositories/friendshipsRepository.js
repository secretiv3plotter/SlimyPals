import { STORES } from '../constants'
import {
  createRecord,
  getManyByIndex,
  getOneByIndex,
  getRecordById,
  softDeleteRecord,
  updateRecord,
  upsertRecord,
} from '../records'

export const friendshipsRepository = Object.freeze({
  create: (values) => createRecord(STORES.FRIENDSHIP, values),
  upsert: (values) => upsertRecord(STORES.FRIENDSHIP, values),
  getById: (id) => getRecordById(STORES.FRIENDSHIP, id),
  getByUserPair: (userId, friendUserId) => {
    return getOneByIndex(STORES.FRIENDSHIP, 'by_user_pair', [userId, friendUserId])
  },
  listForUser: (userId, options) => {
    return getManyByIndex(STORES.FRIENDSHIP, 'by_user_id', userId, options)
  },
  listForFriend: (friendUserId, options) => {
    return getManyByIndex(STORES.FRIENDSHIP, 'by_friend_user_id', friendUserId, options)
  },
  update: (id, updates) => updateRecord(STORES.FRIENDSHIP, id, updates),
  softDelete: (id) => softDeleteRecord(STORES.FRIENDSHIP, id),
})
