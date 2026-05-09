import { hasAuthSession } from '../authSession'
import { syncPendingActions } from '../offlineSync'
import { getBrowserClientId, getNetworkStatus } from '../networkStatus'
import { loadDomain } from './localDomainGateway'
import { loadRemoteDomain } from './remoteDomainGateway'
import { saveRemoteDomainToCache, toUiDomain } from './remoteDomainCache'

export async function hydrateDomain({ onDomain, onRemoteError } = {}) {
  const localDomain = await loadDomain()
  onDomain?.(localDomain)

  if (!getNetworkStatus().isOnline || !hasAuthSession()) {
    return { localDomain, remoteDomain: null }
  }

  try {
    await syncPendingActions({ clientId: getBrowserClientId() })
    const remoteDomain = await loadRemoteDomain()
    await saveRemoteDomainToCache(remoteDomain)
    const reconciledDomain = toUiDomain(remoteDomain) || localDomain
    onDomain?.(reconciledDomain)

    return { localDomain, remoteDomain, reconciledDomain }
  } catch (error) {
    onRemoteError?.(error)
    return { localDomain, remoteDomain: null, remoteError: error }
  }
}
