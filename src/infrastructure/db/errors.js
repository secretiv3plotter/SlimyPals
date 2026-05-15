export class IndexedDbUnavailableError extends Error {
  constructor() {
    super('IndexedDB is not available in this runtime.')
    this.name = 'IndexedDbUnavailableError'
  }
}

export class RecordNotFoundError extends Error {
  constructor(storeName, id) {
    super(`No record found in "${storeName}" with id "${id}".`)
    this.name = 'RecordNotFoundError'
  }
}
