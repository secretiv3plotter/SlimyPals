import { getAuthenticatedUser, hasAuthSession } from '../authSession'
import { syncPendingActions } from '../offlineSync'
import { getBrowserClientId, getNetworkStatus } from '../networkStatus'
import { createEmptyDomain, loadDomain } from './localDomainGateway'
import { loadRemoteDomain } from './remoteDomainGateway'
import { saveRemoteDomainToCache, toUiDomain } from './remoteDomainCache'

export async function hydrateDomain({ onDomain, onRemoteError } = {}) {
  const authenticatedUser = getAuthenticatedUser()
  const isOnline = getNetworkStatus().isOnline
  const hasSession = hasAuthSession()

  if (!hasSession) {
    const localDomain = await loadDomain()
    onDomain?.(localDomain)

    return { localDomain, remoteDomain: null }
  }

  if (!isOnline) {
    const cachedDomain = await loadDomain(authenticatedUser?.id)
    const localDomain = cachedDomain.user
      ? cachedDomain
      : createEmptyDomain(authenticatedUser)
    onDomain?.(localDomain)

    return { localDomain, remoteDomain: null }
  }

  const emptyDomain = createEmptyDomain(authenticatedUser)
  onDomain?.(emptyDomain)

  try {
    await syncPendingActions({ clientId: getBrowserClientId() })
    const remoteDomain = await loadRemoteDomain()
    await saveRemoteDomainToCache(remoteDomain)
    const reconciledDomain = toUiDomain(remoteDomain) || emptyDomain
    onDomain?.(reconciledDomain)

    return { localDomain: emptyDomain, remoteDomain, reconciledDomain }
  } catch (error) {
    const cachedDomain = await loadDomain(authenticatedUser?.id)
    const fallbackDomain = cachedDomain.user
      ? cachedDomain
      : emptyDomain
    onDomain?.(fallbackDomain)
    onRemoteError?.(error)

    return { localDomain: fallbackDomain, remoteDomain: null, remoteError: error }
  }
}
