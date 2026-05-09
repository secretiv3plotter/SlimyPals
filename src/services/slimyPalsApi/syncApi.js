import { apiRequest, getJsonOptions } from './client'

export function syncActions({ actions, clientId }) {
  return apiRequest('/sync/actions', getJsonOptions('POST', {
    actions,
    clientId,
  }))
}
