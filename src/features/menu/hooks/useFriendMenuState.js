import { useState } from 'react'

export function useFriendMenuState() {
  const [friends, setFriends] = useState([])
  const [friendName, setFriendName] = useState('')
  const [selectedFriend, setSelectedFriend] = useState(null)

  function handleAddFriend() {
    if (!friendName.trim()) {
      return
    }

    setFriends((currentFriends) => [
      ...currentFriends,
      {
        id: Date.now(),
        name: friendName,
        online: Math.random() > 0.5,
      },
    ])
    setFriendName('')
  }

  function handleRemoveFriend(friendId) {
    setFriends((currentFriends) => (
      currentFriends.filter((friend) => friend.id !== friendId)
    ))
  }

  return {
    friendName,
    friends,
    handleAddFriend,
    handleRemoveFriend,
    selectedFriend,
    setFriendName,
    setSelectedFriend,
  }
}
