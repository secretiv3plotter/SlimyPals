import { apiRequest, getJsonOptions } from './client'

export function getFoodFactory() {
  return apiRequest('/me/food-factory')
}

export function produceFood() {
  return apiRequest('/me/food-factory/produce', getJsonOptions('POST', {}))
}
