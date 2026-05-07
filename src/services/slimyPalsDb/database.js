import Dexie from 'dexie'
import { DB_NAME, DB_VERSION } from './constants'
import { IndexedDbUnavailableError } from './errors'
import { DB_SCHEMA } from './schema'

class SlimyPalsDexie extends Dexie {
  constructor() {
    super(DB_NAME)

    this.version(DB_VERSION).stores(
      Object.fromEntries(
        Object.entries(DB_SCHEMA).map(([storeName, definition]) => [
          storeName,
          definition.storeSchema,
        ]),
      ),
    )
  }
}

export const db = new SlimyPalsDexie()

export async function openSlimyPalsDb() {
  assertIndexedDb()
  await db.open()
  return db
}

export function closeSlimyPalsDb() {
  db.close()
  return Promise.resolve()
}

export async function deleteSlimyPalsDb() {
  assertIndexedDb()
  db.close()
  await db.delete()
}

export async function withTransaction(storeNames, mode, operation) {
  assertIndexedDb()

  const names = Array.isArray(storeNames) ? storeNames : [storeNames]
  const dexieMode = mode === 'readonly' || mode === 'r' ? 'r' : 'rw'
  const tables = names.map((storeName) => getTable(storeName))
  const stores = Object.fromEntries(
    names.map((storeName) => [storeName, getTable(storeName)]),
  )

  return db.transaction(dexieMode, tables, () => operation(stores, db.currentTransaction))
}

export function getTable(storeName) {
  return db.table(storeName)
}

function assertIndexedDb() {
  if (!globalThis.indexedDB) {
    throw new IndexedDbUnavailableError()
  }
}
