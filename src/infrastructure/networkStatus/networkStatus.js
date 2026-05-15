export function getNetworkStatus() {
  return {
    isOnline: navigator.onLine,
  }
}

export function subscribeToNetworkStatus(listener) {
  function notifyOnline() {
    listener({ isOnline: true })
  }

  function notifyOffline() {
    listener({ isOnline: false })
  }

  window.addEventListener('online', notifyOnline)
  window.addEventListener('offline', notifyOffline)

  return () => {
    window.removeEventListener('online', notifyOnline)
    window.removeEventListener('offline', notifyOffline)
  }
}
