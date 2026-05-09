import { useCallback } from 'react'
import { runtimeConfig } from '../../../config'
import MockFriendOnlineNotifications from './MockFriendOnlineNotifications'
import NetworkStatusNotifier from './NetworkStatusNotifier'
import NotificationStack from './NotificationStack'

function AppNotificationLayer({ notifications, onDismiss, setNotifications }) {
  const addNotification = useCallback((message) => {
    setNotifications((currentNotifications) => [
      ...currentNotifications,
      {
        id: crypto.randomUUID(),
        message,
      },
    ].slice(-3))
  }, [setNotifications])

  return (
    <>
      <NotificationStack
        notifications={notifications}
        onDismiss={onDismiss}
      />
      <NetworkStatusNotifier addNotification={addNotification} />
      {runtimeConfig.enableMockFriendNotifications && (
        <MockFriendOnlineNotifications setNotifications={setNotifications} />
      )}
    </>
  )
}

export default AppNotificationLayer
