import { apiRequest, getJsonOptions } from './client'

export function listMySlimes() {
  return apiRequest('/me/slimes')
}

export function summonSlime() {
  return apiRequest('/me/slimes/summon', getJsonOptions('POST', {}))
}

export function feedMySlime(slimeId) {
  return apiRequest(`/me/slimes/${slimeId}/feed`, getJsonOptions('POST', {}))
}

export function pokeMySlime(slimeId) {
  return apiRequest(`/me/slimes/${slimeId}/poke`, getJsonOptions('POST', {}))
}

export function deleteMySlime(slimeId) {
  return apiRequest(`/me/slimes/${slimeId}`, getJsonOptions('DELETE'))
}
