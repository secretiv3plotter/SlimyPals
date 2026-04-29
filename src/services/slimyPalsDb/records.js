import { getTable } from './database'
import { RecordNotFoundError } from './errors'
import { applyRecordDefaults } from './recordDefaults'
import { INDEX_ALIASES } from './schema'
import { nowIso } from './time'

export async function createRecord(storeName, values) {
  const record = applyRecordDefaults(storeName, values)
  await getTable(storeName).add(record)
  return record
}

export async function upsertRecord(storeName, values) {
  const record = applyRecordDefaults(storeName, values)
  await getTable(storeName).put(record)
  return record
}

export function getRecordById(storeName, id) {
  return getTable(storeName).get(id)
}

export async function getAllRecords(storeName, options = {}) {
  const records = await getTable(storeName).toArray()
  return filterDeleted(records, options)
}

export function getOneByIndex(storeName, indexName, value) {
  return getTable(storeName).where(resolveIndexName(storeName, indexName)).equals(value).first()
}

export async function getManyByIndex(storeName, indexName, value, options = {}) {
  const records = await getTable(storeName)
    .where(resolveIndexName(storeName, indexName))
    .equals(value)
    .toArray()

  return filterDeleted(records, options)
}

export function countByIndex(storeName, indexName, value) {
  return getTable(storeName).where(resolveIndexName(storeName, indexName)).equals(value).count()
}

export async function updateRecord(storeName, id, updates) {
  const table = getTable(storeName)
  const existing = await table.get(id)

  if (!existing) {
    throw new RecordNotFoundError(storeName, id)
  }

  const next = { ...existing, ...updates, id }
  await table.put(next)
  return next
}

export function softDeleteRecord(storeName, id, deletedAt = nowIso()) {
  return updateRecord(storeName, id, { deleted_at: deletedAt })
}

export async function hardDeleteRecord(storeName, id) {
  await getTable(storeName).delete(id)
  return id
}

function resolveIndexName(storeName, indexName) {
  return INDEX_ALIASES[storeName]?.[indexName] || indexName
}

function filterDeleted(records, { includeDeleted = false } = {}) {
  if (includeDeleted) {
    return records
  }

  return records.filter((record) => !record.deleted_at)
}
