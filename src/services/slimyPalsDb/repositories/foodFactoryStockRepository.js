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

export const foodFactoryStockRepository = Object.freeze({
  create: (values) => createRecord(STORES.FOOD_FACTORY_STOCK, values),
  upsert: (values) => upsertRecord(STORES.FOOD_FACTORY_STOCK, values),
  getById: (id) => getRecordById(STORES.FOOD_FACTORY_STOCK, id),
  getByUserId: (userId) => getOneByIndex(STORES.FOOD_FACTORY_STOCK, 'by_user_id', userId),
  list: (options) => getAllRecords(STORES.FOOD_FACTORY_STOCK, options),
  update: (id, updates) => updateRecord(STORES.FOOD_FACTORY_STOCK, id, updates),
  softDelete: (id) => softDeleteRecord(STORES.FOOD_FACTORY_STOCK, id),
})
