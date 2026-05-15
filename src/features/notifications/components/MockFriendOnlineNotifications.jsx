import { useEffect } from 'react'
import { mockOnlineFriends } from '../../../domain/mockOnlineFriends'

function MockFriendOnlineNotifications({ setNotifications }) {
  useEffect(() => {
    setNotifications((currentNotifications) => [
      ...currentNotifications,
      ...mockOnlineFriends.map((friend) => ({
        id: crypto.randomUUID(),
        message: `${friend.username} is online.`,
      })),
    ].slice(-4))
  }, [setNotifications])

  return null
}

export default MockFriendOnlineNotifications
