import { STORES } from '../constants'
import {
  createRecord,
  getAllRecords,
  getOneByIndex,
  getRecordById,
  softDeleteRecord,
  updateRecord,
  upsertRecord,
} from '../records'

export const usersRepository = Object.freeze({
  create: (values) => createRecord(STORES.USER, values),
  upsert: (values) => upsertRecord(STORES.USER, values),
  getById: (id) => getRecordById(STORES.USER, id),
  getByUsername: (username) => getOneByIndex(STORES.USER, 'by_username', username),
  list: (options) => getAllRecords(STORES.USER, options),
  update: (id, updates) => updateRecord(STORES.USER, id, updates),
  softDelete: (id) => softDeleteRecord(STORES.USER, id),
})
