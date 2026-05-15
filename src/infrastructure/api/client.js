import { API_BASE_URL } from '../../config/apiConfig'
import { createApiError, createNetworkApiError } from './apiError'

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export async function apiRequest(path, options = {}) {
  const response = await fetchApi(path, options)
  const responseBody = await parseResponseBody(response)

  if (responseBody?.error?.code === 'INVALID_JSON_RESPONSE') {
    throw createApiError(response.status, responseBody)
  }

  if (!response.ok) {
    throw createApiError(response.status, responseBody)
  }

  return responseBody
}

export function getJsonOptions(method, body) {
  return {
    body: body === undefined ? undefined : JSON.stringify(body),
    method,
  }
}

function getHeaders(headers = {}) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  }
}

async function fetchApi(path, options) {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: getHeaders(options.headers),
    })
  } catch (error) {
    throw createNetworkApiError(error)
  }
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()

  try {
    return text ? JSON.parse(text) : null
  } catch {
    return {
      error: {
        code: 'INVALID_JSON_RESPONSE',
        message: 'The Slimy Pals server returned an invalid response.',
      },
    }
  }
}
