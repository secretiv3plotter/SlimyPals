import { useEffect } from 'react'
import { subscribeToNetworkStatus } from '../../../services/networkStatus'

function NetworkStatusNotifier({ addNotification }) {
  useEffect(() => subscribeToNetworkStatus(({ isOnline }) => {
    if (!isOnline) {
      addNotification('You are offline. Actions will stay queued.')
      return
    }

    addNotification('You are online. Syncing queued actions.')
  }), [addNotification])

  return null
}

export default NetworkStatusNotifier
