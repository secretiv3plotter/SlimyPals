export * from './constants'
export { db } from './database'
export {
  closeSlimyPalsDb,
  deleteSlimyPalsDb,
  openSlimyPalsDb,
  withTransaction,
} from './database'
export { getUserDomainSnapshot } from './domainSnapshots'
export { IndexedDbUnavailableError, RecordNotFoundError } from './errors'
export * from './records'
export {
  foodFactoryStockRepository,
  friendshipsRepository,
  interactionLogsRepository,
  pendingSyncActionsRepository,
  slimesRepository,
  usersRepository,
} from './repositories'
export { DB_SCHEMA } from './schema'

import { DB_NAME, DB_VERSION, STORES } from './constants'
import { db, closeSlimyPalsDb, deleteSlimyPalsDb, openSlimyPalsDb, withTransaction } from './database'
import { getUserDomainSnapshot } from './domainSnapshots'
import {
  countByIndex,
  createRecord,
  getAllRecords,
  getManyByIndex,
  getOneByIndex,
  getRecordById,
  hardDeleteRecord,
  softDeleteRecord,
  updateRecord,
  upsertRecord,
} from './records'
import {
  foodFactoryStockRepository,
  friendshipsRepository,
  interactionLogsRepository,
  pendingSyncActionsRepository,
  slimesRepository,
  usersRepository,
} from './repositories'
import { DB_SCHEMA } from './schema'

export const slimyPalsDb = Object.freeze({
  name: DB_NAME,
  version: DB_VERSION,
  schema: DB_SCHEMA,
  stores: STORES,
  dexie: db,
  open: openSlimyPalsDb,
  close: closeSlimyPalsDb,
  deleteDatabase: deleteSlimyPalsDb,
  transaction: withTransaction,
  createRecord,
  upsertRecord,
  getRecordById,
  getAllRecords,
  getOneByIndex,
  getManyByIndex,
  countByIndex,
  updateRecord,
  softDeleteRecord,
  hardDeleteRecord,
  getUserDomainSnapshot,
  users: usersRepository,
  foodFactoryStock: foodFactoryStockRepository,
  friendships: friendshipsRepository,
  slimes: slimesRepository,
  interactionLogs: interactionLogsRepository,
  pendingSyncActions: pendingSyncActionsRepository,
})

export default slimyPalsDb
