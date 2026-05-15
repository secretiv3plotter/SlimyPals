import { getApiErrorMessage } from './apiErrorMessages'

export class SlimyPalsApiError extends Error {
  constructor({ code, details, message, status }) {
    super(message || 'Slimy Pals API request failed.')
    this.name = 'SlimyPalsApiError'
    this.code = code || 'API_ERROR'
    this.details = details || {}
    this.userMessage = getApiErrorMessage({ code: this.code, message })
    this.status = status
  }
}

export function createApiError(status, responseBody) {
  const error = responseBody?.error || {}

  return new SlimyPalsApiError({
    code: error.code,
    details: error.details,
    message: error.message,
    status,
  })
}

export function createNetworkApiError(error) {
  return new SlimyPalsApiError({
    code: 'NETWORK_ERROR',
    details: { cause: error?.message },
    message: 'Unable to reach the Slimy Pals server.',
    status: 0,
  })
}
