import { STORES } from '../constants'
import {
  createRecord,
  getAllRecords,
  getManyByIndex,
  getRecordById,
  softDeleteRecord,
  updateRecord,
  upsertRecord,
} from '../records'

export const slimesRepository = Object.freeze({
  create: (values) => createRecord(STORES.SLIME, values),
  upsert: (values) => upsertRecord(STORES.SLIME, values),
  getById: (id) => getRecordById(STORES.SLIME, id),
  listByUserId: (userId, options) => getManyByIndex(STORES.SLIME, 'by_user_id', userId, options),
  listByRarity: (rarity, options) => getManyByIndex(STORES.SLIME, 'by_rarity', rarity, options),
  list: (options) => getAllRecords(STORES.SLIME, options),
  update: (id, updates) => updateRecord(STORES.SLIME, id, updates),
  softDelete: (id) => softDeleteRecord(STORES.SLIME, id),
})
