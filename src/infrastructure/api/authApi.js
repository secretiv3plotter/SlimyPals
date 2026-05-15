import { apiRequest, getJsonOptions } from './client'

export function register(credentials) {
  return apiRequest('/auth/register', getJsonOptions('POST', credentials))
}

export function login(credentials) {
  return apiRequest('/auth/login', getJsonOptions('POST', credentials))
}

export function refreshToken(refreshTokenValue) {
  return apiRequest('/auth/refresh', getJsonOptions('POST', {
    refreshToken: refreshTokenValue,
  }))
}

export function logout(refreshTokenValue) {
  return apiRequest('/auth/logout', getJsonOptions('POST', {
    refreshToken: refreshTokenValue,
  }))
}
